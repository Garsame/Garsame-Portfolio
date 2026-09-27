import "server-only";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { Message, type IMessage } from "@/models";
import { sendLoggedMail } from "@/lib/email/logger";

export type AdminMessageView = {
  id: string;
  name: string;
  email: string;
  business?: string;
  need?: string;
  message: string;
  read: boolean;
  archived: boolean;
  createdAt: string;
  timeAgo: string;
};

export type MessageCounts = {
  unread: number;
  all: number;
  archived: number;
};

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "Africa/Mogadishu",
    }).format(date);
  }
  if (diffDay > 0) return `${diffDay}d`;
  if (diffHour > 0) return `${diffHour}h`;
  if (diffMin > 0) return `${diffMin}m`;
  return "just now";
}

export async function listAdminMessages(
  filter: "unread" | "all" | "archived" = "unread",
): Promise<{
  messages: AdminMessageView[];
  counts: MessageCounts;
}> {
  await requireAdmin();
  await dbConnect();

  const [unreadCount, totalCount, archivedCount] = await Promise.all([
    Message.countDocuments({ read: false, archived: false }),
    Message.countDocuments({}),
    Message.countDocuments({ archived: true }),
  ]);

  const query: Record<string, unknown> = {};
  if (filter === "unread") {
    query.read = false;
    query.archived = false;
  } else if (filter === "archived") {
    query.archived = true;
  }
  // "all" has no filter

  type LeanMessage = IMessage & { _id: unknown };

  const docs = (await Message.find(query)
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanMessage[];

  const messages: AdminMessageView[] = docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    business: doc.business,
    need: doc.need,
    message: doc.message,
    read: Boolean(doc.read),
    archived: Boolean(doc.archived),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    timeAgo: doc.createdAt ? formatTimeAgo(new Date(doc.createdAt)) : "recently",
  }));

  return {
    messages,
    counts: {
      unread: unreadCount,
      all: totalCount,
      archived: archivedCount,
    },
  };
}

export async function setMessageRead(
  id: string,
  read: boolean,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await dbConnect();

  try {
    await Message.findByIdAndUpdate(id, { $set: { read } });
    revalidatePath("/admin");
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update message.",
    };
  }
}

export async function setMessageArchived(
  id: string,
  archived: boolean,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await dbConnect();

  try {
    await Message.findByIdAndUpdate(id, { $set: { archived } });
    revalidatePath("/admin");
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update message.",
    };
  }
}

export async function deleteAdminMessage(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await dbConnect();

  try {
    await Message.findByIdAndDelete(id);
    revalidatePath("/admin");
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete message.",
    };
  }
}

export async function replyAdminMessage(
  id: string,
  replyText: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await dbConnect();

  const doc = await Message.findById(id);
  if (!doc) return { success: false, error: "Message not found." };

  try {
    const subject = `Re: Your enquiry to Garsame${doc.business ? ` · ${doc.business}` : ""}`;
    const html = `
      <p style="margin:0 0 16px;">Hello ${doc.name},</p>
      <div style="margin:0 0 24px; white-space: pre-wrap; font-size: 15px; line-height: 1.7;">${replyText}</div>
      <div style="border-top: 1px solid #E4E8F7; padding-top: 16px; font-size: 13px; color: #64708F;">
        Best regards,<br>
        <strong>Garsame Mohamud</strong><br>
        <a href="https://garsame.so" style="color: #3D5AF1;">garsame.so</a>
      </div>
    `;

    const res = await sendLoggedMail({
      type: "broadcast", // or general direct reply
      to: doc.email,
      subject,
      html,
      text: replyText,
    });

    if (!res.success) {
      return { success: false, error: `Failed to send email: ${res.error}` };
    }

    doc.read = true;
    await doc.save();

    revalidatePath("/admin");
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send reply.",
    };
  }
}
