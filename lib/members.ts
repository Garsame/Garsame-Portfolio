import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { dbConnect } from "@/lib/db";
import { Member, newUnsubToken, type MEMBER_SOURCES } from "@/models";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateAntiSpam } from "@/lib/anti-spam";
import { renderWelcomeEmail } from "@/lib/email/templates";
import { sendLoggedMail } from "@/lib/email/logger";

export type JoinMembershipPayload = {
  firstName: string;
  lastName?: string;
  email: string;
  source?: (typeof MEMBER_SOURCES)[number];
  honeypot?: string;
  timestampToken?: string;
};

export type JoinMembershipResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function joinMembership(
  payload: JoinMembershipPayload,
): Promise<JoinMembershipResult> {
  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);

  /* 1. Rate Limiting */
  const rateLimit = checkRateLimit(`member:${ip}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many attempts from your connection. Please wait ${rateLimit.resetSeconds} seconds.`,
    };
  }

  /* 2. Anti-Spam Check */
  const antiSpam = validateAntiSpam({
    honeypot: payload.honeypot,
    timestampToken: payload.timestampToken,
    minElapsedSeconds: 1.5,
  });

  if (!antiSpam.passed) {
    if (antiSpam.reason?.includes("Honeypot") || antiSpam.reason?.includes("quickly")) {
      return {
        success: true,
        message: "Thank you for joining! Check your inbox for a confirmation note.",
      };
    }
    return {
      success: false,
      error: antiSpam.reason || "Submission verification failed.",
    };
  }

  /* 3. Validation */
  const firstName = payload.firstName?.trim();
  const lastName = payload.lastName?.trim() || undefined;
  const email = payload.email?.toLowerCase().trim();
  const source = payload.source || "membership";

  if (!firstName || firstName.length < 2) {
    return { success: false, error: "Please provide your first name." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please provide a valid email address." };
  }

  await dbConnect();

  try {
    let member = await Member.findOne({ email });

    if (member) {
      if (member.status === "active") {
        return {
          success: true,
          message: "You are already a member! You'll hear from me when the next piece is ready.",
        };
      }

      // Reactivate previously unsubscribed member
      member.status = "active";
      member.firstName = firstName;
      if (lastName) member.lastName = lastName;
      member.source = source;
      member.unsubToken = newUnsubToken();
      member.joinedAt = new Date();
      member.unsubscribedAt = undefined;
      await member.save();
    } else {
      // Create new member
      member = await Member.create({
        firstName,
        lastName,
        email,
        source,
        status: "active",
        unsubToken: newUnsubToken(),
        joinedAt: new Date(),
      });
    }

    /* 4. Trigger Welcome Email (Rule 5 logged send) */
    const welcome = renderWelcomeEmail({
      firstName: member.firstName,
      unsubToken: member.unsubToken,
    });

    sendLoggedMail({
      type: "welcome",
      to: member.email,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
    }).catch((err) => console.error("[member:welcomeEmail]", err));

    /* 5. Revalidate Admin Pages */
    revalidatePath("/admin");
    revalidatePath("/admin/members");

    return {
      success: true,
      message: "You're in! Check your inbox for a welcome note.",
    };
  } catch (err) {
    console.error("[member:join]", err);
    return {
      success: false,
      error: "Could not complete your signup. Please try again.",
    };
  }
}

export async function unsubscribeByToken(token: string): Promise<{
  success: boolean;
  member?: { firstName: string; email: string; status: string };
  error?: string;
}> {
  if (!token || typeof token !== "string") {
    return { success: false, error: "Invalid or missing unsubscribe token." };
  }

  await dbConnect();
  const member = await Member.findOne({ unsubToken: token });

  if (!member) {
    return { success: false, error: "We could not find a member with this unsubscribe link." };
  }

  if (member.status !== "unsubscribed") {
    member.status = "unsubscribed";
    member.unsubscribedAt = new Date();
    await member.save();

    revalidatePath("/admin");
    revalidatePath("/admin/members");
  }

  return {
    success: true,
    member: {
      firstName: member.firstName,
      email: member.email,
      status: member.status,
    },
  };
}

export async function resubscribeByToken(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!token) return { success: false, error: "Invalid token." };

  await dbConnect();
  const member = await Member.findOne({ unsubToken: token });

  if (!member) {
    return { success: false, error: "Member not found." };
  }

  member.status = "active";
  member.unsubscribedAt = undefined;
  await member.save();

  revalidatePath("/admin");
  revalidatePath("/admin/members");

  return { success: true };
}
