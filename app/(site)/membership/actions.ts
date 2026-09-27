"use server";

import { joinMembership, type JoinMembershipPayload } from "@/lib/members";

export async function joinMembershipAction(payload: JoinMembershipPayload) {
  return await joinMembership(payload);
}
