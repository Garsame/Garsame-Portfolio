import "server-only";

import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { Broadcast, MailLog, Member, type IMailLog } from "@/models";
import { getMailTransporter } from "@/lib/email/mailer";
import { renderBroadcastEmail } from "@/lib/email/broadcast";
import { revalidatePath } from "next/cache";

export type MailLogRow = {
  id: string;
  to: string;
  status: "queued" | "sent" | "failed" | "bounced";
  time?: string | null;
  error?: string | null;
  attempts: number;
  sentAt?: string | null;
  createdAt: string;
};

export type BroadcastMailLogsData = {
  broadcast: {
    id: string;
    subject: string;
    sentAt?: string | null;
    createdAt: string;
    state: string;
  };
  logs: MailLogRow[];
  stats: {
    recipients: number;
    delivered: number;
    failed: number;
    queued: number;
    opened: number; // Placeholder/mock 0 or estimated for display
  };
};

/**
 * Returns mail logs for a specific broadcast campaign.
 */
export async function getBroadcastMailLogs(
  broadcastId: string,
  statusFilter?: "all" | "sent" | "failed" | "queued",
): Promise<BroadcastMailLogsData | null> {
  await requireAdmin();
  await dbConnect();

  const broadcastDoc = await Broadcast.findById(broadcastId)
    .select("subject sentAt createdAt state")
    .lean<{ _id: Types.ObjectId; subject: string; sentAt?: Date; createdAt: Date; state: string }>();

  if (!broadcastDoc) return null;

  const bId = new Types.ObjectId(broadcastId);

  const [totalCount, sentCount, failedCount, queuedCount] = await Promise.all([
    MailLog.countDocuments({ broadcast: bId }),
    MailLog.countDocuments({ broadcast: bId, status: "sent" }),
    MailLog.countDocuments({ broadcast: bId, status: "failed" }),
    MailLog.countDocuments({ broadcast: bId, status: "queued" }),
  ]);

  const query: Record<string, unknown> = { broadcast: bId };
  if (statusFilter && statusFilter !== "all") {
    query.status = statusFilter;
  }

  const rawLogs = await MailLog.find(query)
    .sort({ createdAt: -1 })
    .lean<(IMailLog & { _id: Types.ObjectId })[]>();

  const logs: MailLogRow[] = rawLogs.map((log) => ({
    id: String(log._id),
    to: log.to,
    status: log.status,
    time: (log.sentAt || log.createdAt).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Africa/Mogadishu",
    }),
    error: log.error || null,
    attempts: log.attempts || 0,
    sentAt: log.sentAt ? log.sentAt.toISOString() : null,
    createdAt: log.createdAt.toISOString(),
  }));

  return {
    broadcast: {
      id: String(broadcastDoc._id),
      subject: broadcastDoc.subject,
      sentAt: broadcastDoc.sentAt ? broadcastDoc.sentAt.toISOString() : null,
      createdAt: broadcastDoc.createdAt.toISOString(),
      state: broadcastDoc.state,
    },
    logs,
    stats: {
      recipients: totalCount,
      delivered: sentCount,
      failed: failedCount,
      queued: queuedCount,
      opened: 0,
    },
  };
}

/**
 * Retries sending an individual failed MailLog record.
 */
export async function retrySingleMailLog(
  logId: string,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  await dbConnect();

  const logDoc = await MailLog.findById(logId);
  if (!logDoc) return { ok: false, message: "Log record not found." };

  if (!logDoc.broadcast) {
    return { ok: false, message: "Log is not attached to a broadcast." };
  }

  const broadcast = await Broadcast.findById(logDoc.broadcast);
  if (!broadcast) return { ok: false, message: "Associated broadcast not found." };

  const member = await Member.findOne({ email: logDoc.to }).lean<{
    firstName: string;
    unsubToken: string;
  }>();

  const { transporter, config } = await getMailTransporter();
  const fromAddress = config.fromName
    ? `"${config.fromName}" <${config.fromEmail}>`
    : config.fromEmail;

  const { html, text } = renderBroadcastEmail({
    subject: broadcast.subject,
    previewText: broadcast.previewText,
    bodyJson: broadcast.body,
    memberName: member?.firstName,
    unsubToken: member?.unsubToken,
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: logDoc.to,
      subject: broadcast.subject,
      html,
      text,
    });

    const wasFailed = logDoc.status === "failed";
    logDoc.status = "sent";
    logDoc.sentAt = new Date();
    logDoc.attempts += 1;
    logDoc.error = undefined;
    await logDoc.save();

    if (wasFailed) {
      await Broadcast.updateOne(
        { _id: broadcast._id },
        { $inc: { deliveredCount: 1, failedCount: -1 } },
      );
    }

    revalidatePath(`/admin/updates/${String(broadcast._id)}/logs`);
    revalidatePath("/admin/updates");
    return { ok: true };
  } catch (err) {
    const errMsg =
      err instanceof Error ? err.message : "Unknown SMTP transmission error";
    logDoc.status = "failed";
    logDoc.attempts += 1;
    logDoc.error = errMsg.slice(0, 4000);
    await logDoc.save();

    revalidatePath(`/admin/updates/${String(broadcast._id)}/logs`);
    return { ok: false, message: errMsg };
  }
}

/**
 * Retries all failed MailLog records for a broadcast in batch.
 */
export async function retryFailedBroadcastLogs(
  broadcastId: string,
): Promise<{ ok: boolean; retried: number; succeeded: number; failed: number }> {
  await requireAdmin();
  await dbConnect();

  const failedLogs = await MailLog.find({
    broadcast: new Types.ObjectId(broadcastId),
    status: "failed",
  });

  let succeeded = 0;
  let failed = 0;

  for (const log of failedLogs) {
    const res = await retrySingleMailLog(String(log._id));
    if (res.ok) {
      succeeded += 1;
    } else {
      failed += 1;
    }
  }

  revalidatePath(`/admin/updates/${broadcastId}/logs`);
  revalidatePath("/admin/updates");

  return {
    ok: true,
    retried: failedLogs.length,
    succeeded,
    failed,
  };
}

/**
 * Generates CSV string for exporting broadcast delivery logs.
 */
export async function exportMailLogsCsv(broadcastId: string): Promise<string> {
  await requireAdmin();
  await dbConnect();

  const logs = await MailLog.find({
    broadcast: new Types.ObjectId(broadcastId),
  })
    .sort({ createdAt: 1 })
    .lean<(IMailLog & { _id: Types.ObjectId })[]>();

  const rows = [["Recipient", "Status", "Attempts", "Sent At", "Error"]];

  for (const log of logs) {
    rows.push([
      log.to,
      log.status,
      String(log.attempts || 1),
      log.sentAt ? log.sentAt.toISOString() : "",
      log.error ? `"${log.error.replace(/"/g, '""')}"` : "",
    ]);
  }

  return rows.map((r) => r.join(",")).join("\n");
}
