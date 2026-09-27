"use server";

import {
  deleteAdminMember,
  listAdminMembers,
  toggleAdminMemberStatus,
  type ListMembersOptions,
} from "@/lib/admin/members";

export async function listAdminMembersAction(opts: ListMembersOptions) {
  return await listAdminMembers(opts);
}

export async function deleteAdminMemberAction(id: string) {
  return await deleteAdminMember(id);
}

export async function toggleAdminMemberStatusAction(
  id: string,
  status: "active" | "unsubscribed",
) {
  return await toggleAdminMemberStatus(id, status);
}
