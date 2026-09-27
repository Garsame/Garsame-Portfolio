import "server-only";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Testimonial, TESTIMONIAL_QUOTE_MAX } from "@/models";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateAntiSpam } from "@/lib/anti-spam";
import { getResolvedSmtpConfig } from "@/lib/email/mailer";
import { renderTestimonialNotification } from "@/lib/email/templates";
import { sendLoggedMail } from "@/lib/email/logger";

export type TestimonialSubmitPayload = {
  name: string;
  role?: string;
  business?: string;
  email: string;
  quote: string;
  consent: boolean;
  photoId?: string | null;
  honeypot?: string;
  timestampToken?: string;
};

export type TestimonialSubmitResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function submitTestimonial(
  payload: TestimonialSubmitPayload,
): Promise<TestimonialSubmitResult> {
  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders);

  /* 1. Rate Limit (3 submissions per 15 min per IP) */
  const rateLimit = checkRateLimit(`testimonial:${ip}`, 3, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many submissions. Please wait ${rateLimit.resetSeconds} seconds before trying again.`,
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
        message: "Thank you! Your testimonial has been submitted for review.",
      };
    }
    return {
      success: false,
      error: antiSpam.reason || "Submission verification failed.",
    };
  }

  /* 3. Validation */
  const name = payload.name?.trim();
  const role = payload.role?.trim() || undefined;
  const business = payload.business?.trim() || undefined;
  const email = payload.email?.toLowerCase().trim();
  const quote = payload.quote?.trim();
  const consent = payload.consent === true;

  if (!name || name.length < 2) {
    return { success: false, error: "Please provide your name." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please provide a valid email address." };
  }
  if (!quote || quote.length < 10) {
    return { success: false, error: "Please write a sentence or two about our work." };
  }
  if (quote.length > TESTIMONIAL_QUOTE_MAX) {
    return {
      success: false,
      error: `Testimonials must be within ${TESTIMONIAL_QUOTE_MAX} characters.`,
    };
  }
  if (!consent) {
    return {
      success: false,
      error: "Please check the consent box to allow publishing on the site.",
    };
  }

  await dbConnect();

  try {
    await Testimonial.create({
      name,
      role,
      business,
      email,
      quote,
      consent: true,
      photo: payload.photoId ? new Types.ObjectId(payload.photoId) : undefined,
      status: "pending", // Strictly pending until admin approval (CLAUDE.md Rule 6)
      featured: false,
      submittedIp: ip,
    });

    /* 4. Notification email to Garsame (CLAUDE.md Rule 5 logged send) */
    const smtpConfig = await getResolvedSmtpConfig();
    const emailTemplate = renderTestimonialNotification({
      name,
      role,
      business,
      email,
      quote,
    });

    sendLoggedMail({
      type: "testimonial-notify",
      to: smtpConfig.adminNotifyEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    }).catch((err) => console.error("[testimonial:notifyEmail]", err));

    /* 5. Revalidate Admin */
    revalidatePath("/admin");
    revalidatePath("/admin/testimonials");

    return {
      success: true,
      message: "Thank you for writing this. I read every submission personally before it appears on the site.",
    };
  } catch (err) {
    console.error("[testimonial:submit]", err);
    return {
      success: false,
      error: "Could not save your testimonial. Please try again.",
    };
  }
}
