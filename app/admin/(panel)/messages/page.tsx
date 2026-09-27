import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { listAdminMessages } from "@/lib/admin/messages";
import { MessagesManager } from "@/components/admin/messages/MessagesManager";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function AdminMessagesPage() {
  await requireAdmin();
  const { messages, counts } = await listAdminMessages("unread");

  return (
    <MessagesManager
      initialMessages={messages}
      initialCounts={counts}
    />
  );
}
