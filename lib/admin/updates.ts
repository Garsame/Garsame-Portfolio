import "server-only";

import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { Broadcast, Member, type IBroadcast } from "@/models";
import { sendLoggedMail } from "@/lib/email/logger";
import { getResolvedSmtpConfig } from "@/lib/email/mailer";
import { renderBroadcastEmail, dispatchBroadcast } from "@/lib/email/broadcast";
import { revalidatePath } from "next/cache";

export type AdminBroadcastListItem = {
  id: string;
  subject: string;
  previewText?: string;
  state: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledFor?: string | null;
  sentAt?: string | null;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminBroadcastDetail = {
  id: string;
  subject: string;
  previewText?: string;
  body: unknown;
  bodyText?: string;
  state: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledFor?: string | null;
  sentAt?: string | null;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PastUpdateSummary = {
  id: string;
  subject: string;
  sentAt: string;
  deliveredCount: number;
  failedCount: number;
};

/**
 * Returns all broadcasts for the admin Updates list view.
 */
export async function getBroadcasts(): Promise<{
  broadcasts: AdminBroadcastListItem[];
  counts: {
    all: number;
    drafts: number;
    scheduled: number;
    sent: number;
    failed: number;
  };
  activeMembersCount: number;
}> {
  await requireAdmin();
  await dbConnect();

  const [activeMembersCount, rawDocs] = await Promise.all([
    Member.countDocuments({ status: "active" }),
    Broadcast.find().sort({ createdAt: -1 }).lean<(IBroadcast & { _id: Types.ObjectId })[]>(),
  ]);

  const broadcasts: AdminBroadcastListItem[] = rawDocs.map((doc) => ({
    id: String(doc._id),
    subject: doc.subject,
    previewText: doc.previewText || undefined,
    state: doc.state,
    scheduledFor: doc.scheduledFor ? doc.scheduledFor.toISOString() : null,
    sentAt: doc.sentAt ? doc.sentAt.toISOString() : null,
    recipientCount: doc.recipientCount || 0,
    deliveredCount: doc.deliveredCount || 0,
    failedCount: doc.failedCount || 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }));

  const counts = {
    all: broadcasts.length,
    drafts: broadcasts.filter((b) => b.state === "draft").length,
    scheduled: broadcasts.filter((b) => b.state === "scheduled").length,
    sent: broadcasts.filter((b) => b.state === "sent").length,
    failed: broadcasts.filter((b) => b.state === "failed").length,
  };

  return { broadcasts, counts, activeMembersCount };
}

/**
 * Loads a single broadcast document by ID for editing.
 */
export async function getBroadcastById(
  id: string,
): Promise<AdminBroadcastDetail | null> {
  await requireAdmin();
  await dbConnect();

  const doc = await Broadcast.findById(id).lean<
    IBroadcast & { _id: Types.ObjectId }
  >();
  if (!doc) return null;

  return {
    id: String(doc._id),
    subject: doc.subject,
    previewText: doc.previewText || undefined,
    body: doc.body || null,
    bodyText: doc.bodyText || undefined,
    state: doc.state,
    scheduledFor: doc.scheduledFor ? doc.scheduledFor.toISOString() : null,
    sentAt: doc.sentAt ? doc.sentAt.toISOString() : null,
    recipientCount: doc.recipientCount || 0,
    deliveredCount: doc.deliveredCount || 0,
    failedCount: doc.failedCount || 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Returns a list of the 5 most recent past sent updates for the editor sidebar.
 */
export async function getPastUpdatesSummary(
  limit = 5,
): Promise<PastUpdateSummary[]> {
  await requireAdmin();
  await dbConnect();

  const docs = await Broadcast.find({ state: { $in: ["sent", "failed"] } })
    .sort({ sentAt: -1, createdAt: -1 })
    .limit(limit)
    .select("subject sentAt deliveredCount failedCount")
    .lean<{
      _id: Types.ObjectId;
      subject: string;
      sentAt?: Date;
      createdAt: Date;
      deliveredCount?: number;
      failedCount?: number;
    }[]>();

  return docs.map((d) => ({
    id: String(d._id),
    subject: d.subject,
    sentAt: (d.sentAt || d.createdAt).toISOString(),
    deliveredCount: d.deliveredCount || 0,
    failedCount: d.failedCount || 0,
  }));
}

/**
 * Returns current count of active members.
 */
export async function getActiveMemberCount(): Promise<number> {
  await requireAdmin();
  await dbConnect();
  return Member.countDocuments({ status: "active" });
}

/**
 * Creates or updates a broadcast draft.
 */
export async function saveBroadcastDraft(data: {
  id?: string;
  subject: string;
  previewText?: string;
  body?: unknown;
}): Promise<{ ok: boolean; id?: string; message?: string }> {
  await requireAdmin();
  await dbConnect();

  if (data.id) {
    const broadcast = await Broadcast.findById(data.id);
    if (!broadcast) return { ok: false, message: "Broadcast not found." };
    if (broadcast.state === "sent" || broadcast.state === "sending") {
      return { ok: false, message: "Cannot edit an update that has already been sent." };
    }

    broadcast.subject = data.subject.trim();
    broadcast.previewText = data.previewText?.trim() || undefined;
    broadcast.body = data.body;
    await broadcast.save();

    revalidatePath("/admin/updates");
    return { ok: true, id: String(broadcast._id) };
  } else {
    const broadcast = new Broadcast({
      subject: data.subject.trim(),
      previewText: data.previewText?.trim() || undefined,
      body: data.body,
      state: "draft",
    });
    await broadcast.save();

    revalidatePath("/admin/updates");
    return { ok: true, id: String(broadcast._id) };
  }
}

/**
 * Sends a test email of the draft to Garsame (admin notification email).
 * Strictly logs with type "test" in MailLog.
 */
export async function sendTestBroadcast(data: {
  subject: string;
  previewText?: string;
  body?: unknown;
}): Promise<{ ok: boolean; message?: string; to?: string }> {
  await requireAdmin();
  await dbConnect();

  const config = await getResolvedSmtpConfig();
  const targetEmail = config.adminNotifyEmail || config.fromEmail || "garsame40@gmail.com";

  const { html, text } = renderBroadcastEmail({
    subject: `[TEST] ${data.subject.trim() || "Untitled Update"}`,
    previewText: data.previewText?.trim(),
    bodyJson: data.body,
    memberName: "Garsame (Test)",
  });

  const res = await sendLoggedMail({
    type: "test",
    to: targetEmail,
    subject: `[TEST] ${data.subject.trim() || "Untitled Update"}`,
    html,
    text,
  });

  if (res.success) {
    return { ok: true, to: targetEmail };
  } else {
    return {
      ok: false,
      message: res.error || "Failed to send test email.",
      to: targetEmail,
    };
  }
}

/**
 * Schedules a broadcast for sending in the future.
 */
export async function scheduleBroadcast(
  id: string,
  scheduledFor: Date,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  await dbConnect();

  const broadcast = await Broadcast.findById(id);
  if (!broadcast) return { ok: false, message: "Broadcast not found." };
  if (scheduledFor.getTime() <= Date.now()) {
    return { ok: false, message: "Schedule time must be in the future." };
  }

  broadcast.state = "scheduled";
  broadcast.scheduledFor = scheduledFor;
  await broadcast.save();

  revalidatePath("/admin/updates");
  return { ok: true };
}

/**
 * Cancels a scheduled broadcast, reverting to draft.
 */
export async function cancelScheduledBroadcast(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  await dbConnect();

  const broadcast = await Broadcast.findById(id);
  if (!broadcast) return { ok: false, message: "Broadcast not found." };

  broadcast.state = "draft";
  broadcast.scheduledFor = undefined;
  await broadcast.save();

  revalidatePath("/admin/updates");
  return { ok: true };
}

/**
 * Triggers immediate dispatch of a broadcast to all active members.
 */
export async function triggerBroadcastDispatch(
  id: string,
): Promise<{ ok: boolean; delivered: number; failed: number; message?: string }> {
  await requireAdmin();
  await dbConnect();

  const result = await dispatchBroadcast(id);
  revalidatePath("/admin/updates");
  revalidatePath("/admin");
  return result;
}

/**
 * Deletes a draft or failed broadcast.
 */
export async function deleteBroadcast(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  await dbConnect();

  const broadcast = await Broadcast.findById(id);
  if (!broadcast) return { ok: false, message: "Broadcast not found." };
  if (broadcast.state === "sending") {
    return { ok: false, message: "Cannot delete a broadcast while it is actively sending." };
  }

  await Broadcast.findByIdAndDelete(id);

  revalidatePath("/admin/updates");
  revalidatePath("/admin");
  return { ok: true };
}
