import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { dbConnect } from "@/lib/db";
import { Message } from "@/models";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateAntiSpam } from "@/lib/anti-spam";
import { getResolvedSmtpConfig } from "@/lib/email/mailer";
import { renderContactNotification } from "@/lib/email/templates";
import { sendLoggedMail } from "@/lib/email/logger";

export type ContactSubmissionPayload = {
  name: string;
  email: string;
  business?: string;
  need?: string;
  message: string;
  honeypot?: string;
  timestampToken?: string;
};

export type ContactSubmissionResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function submitContactMessage(
  payload: ContactSubmissionPayload,
): Promise<ContactSubmissionResult> {
  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);

  /* 1. Rate Limit Check (5 per 15 mins per IP) */
  const rateLimit = checkRateLimit(`contact:${ip}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many submissions from your connection. Please wait ${rateLimit.resetSeconds} seconds.`,
    };
  }

  /* 2. Anti-Spam Check (Honeypot + Time-to-submit) */
  const antiSpam = validateAntiSpam({
    honeypot: payload.honeypot,
    timestampToken: payload.timestampToken,
    minElapsedSeconds: 1.5,
  });

  if (!antiSpam.passed) {
    /* Silently return success to confuse automated scrapers if honeypot was triggered,
       or show polite error for expired tokens. */
    if (antiSpam.reason?.includes("Honeypot") || antiSpam.reason?.includes("quickly")) {
      return {
        success: true,
        message: "Thank you. Your message has been sent.",
      };
    }
    return {
      success: false,
      error: antiSpam.reason || "Submission verification failed.",
    };
  }

  /* 3. Server-side Field Validation */
  const name = payload.name?.trim();
  const email = payload.email?.toLowerCase().trim();
  const message = payload.message?.trim();
  const business = payload.business?.trim() || undefined;
  const need = payload.need?.trim() || undefined;

  if (!name || name.length < 2) {
    return { success: false, error: "Please add your name." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please add a valid email address." };
  }
  if (!message || message.length < 5) {
    return { success: false, error: "Please tell me a little more about the problem." };
  }
  if (message.length > 5000) {
    return { success: false, error: "Please keep your message under 5,000 characters." };
  }

  /* 4. Save to Database */
  await dbConnect();
  try {
    await Message.create({
      name,
      email,
      business,
      need,
      message,
      ip,
      read: false,
      archived: false,
    });

    /* 5. Trigger Email Notification to Garsame (CLAUDE.md Rule 5 logged send) */
    const smtpConfig = await getResolvedSmtpConfig();
    const emailTemplate = renderContactNotification({
      name,
      email,
      business,
      need,
      message,
      ip,
      receivedAt: new Date(),
    });

    // We dispatch email without blocking client response
    sendLoggedMail({
      type: "contact-notify",
      to: smtpConfig.adminNotifyEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    }).catch((err) => console.error("[contact:notifyEmail]", err));

    /* 6. Revalidate Admin Pages */
    revalidatePath("/admin");
    revalidatePath("/admin/messages");

    return {
      success: true,
      message: "Thank you. Your message has been received. I will get back to you within 24 hours.",
    };
  } catch (err) {
    console.error("[contact:submit]", err);
    return {
      success: false,
      error: "Could not send your message. Please try again or reach out directly by email.",
    };
  }
}
