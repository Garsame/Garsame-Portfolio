"use server";

import { resubscribeByToken, unsubscribeByToken } from "@/lib/members";

export async function unsubscribeAction(token: string) {
  return await unsubscribeByToken(token);
}

export async function resubscribeAction(token: string) {
  return await resubscribeByToken(token);
}
