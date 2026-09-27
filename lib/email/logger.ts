import "server-only";

import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { MailLog, type MAIL_TYPES } from "@/models";
import { getMailTransporter } from "./mailer";

export type SendLoggedMailOptions = {
  type: (typeof MAIL_TYPES)[number];
  to: string;
  subject: string;
  html: string;
  text?: string;
  broadcastId?: string | Types.ObjectId;
};

export type SendResult = {
  success: boolean;
  logId: string;
  error?: string;
};

/**
 * Sends an email over SMTP while strictly guaranteeing CLAUDE.md Rule 5:
 * "Every email send is logged to the maillogs collection with recipient,
 * subject, status, timestamp and error. No silent sends."
 *
 * An entry is written as `queued` before dispatch and updated to `sent` or `failed`.
 */
export async function sendLoggedMail({
  type,
  to,
  subject,
  html,
  text,
  broadcastId,
}: SendLoggedMailOptions): Promise<SendResult> {
  await dbConnect();

  /* 1. Create the MailLog entry in "queued" status */
  const logDoc = await MailLog.create({
    type,
    to: to.toLowerCase().trim(),
    subject,
    broadcast: broadcastId ? new Types.ObjectId(broadcastId) : undefined,
    status: "queued",
    attempts: 0,
  });

  const logId = String(logDoc._id);

  try {
    const { transporter, config } = await getMailTransporter();

    const fromAddress = config.fromName
      ? `"${config.fromName}" <${config.fromEmail}>`
      : config.fromEmail;

    /* 2. Dispatch via Nodemailer */
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    /* 3. Mark as sent on success */
    logDoc.status = "sent";
    logDoc.sentAt = new Date();
    logDoc.attempts = 1;
    logDoc.error = undefined;
    await logDoc.save();

    return { success: true, logId };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown SMTP transport error";

    console.error(`[email:sendLoggedMail] Failed to send "${subject}" to ${to}:`, err);

    /* 4. Update MailLog with failure reason */
    try {
      logDoc.status = "failed";
      logDoc.attempts = 1;
      logDoc.error = errorMessage.slice(0, 4000);
      await logDoc.save();
    } catch (saveErr) {
      console.error("[email:saveLogFailure]", saveErr);
    }

    return {
      success: false,
      logId,
      error: errorMessage,
    };
  }
}
