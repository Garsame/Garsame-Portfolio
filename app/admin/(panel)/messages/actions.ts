"use server";

import {
  deleteAdminMessage,
  listAdminMessages,
  replyAdminMessage,
  setMessageArchived,
  setMessageRead,
} from "@/lib/admin/messages";

export async function listAdminMessagesAction(filter: "unread" | "all" | "archived") {
  return await listAdminMessages(filter);
}

export async function setMessageReadAction(id: string, read: boolean) {
  return await setMessageRead(id, read);
}

export async function setMessageArchivedAction(id: string, archived: boolean) {
  return await setMessageArchived(id, archived);
}

export async function deleteAdminMessageAction(id: string) {
  return await deleteAdminMessage(id);
}

export async function replyAdminMessageAction(id: string, text: string) {
  return await replyAdminMessage(id, text);
}
