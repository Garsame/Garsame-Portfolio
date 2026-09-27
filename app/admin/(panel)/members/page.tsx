import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { listAdminMembers } from "@/lib/admin/members";
import { MembersManager } from "@/components/admin/members/MembersManager";

export const metadata: Metadata = {
  title: "Members",
};

export default async function AdminMembersPage() {
  await requireAdmin();
  const { members, counts, total, page, totalPages } = await listAdminMembers({
    filter: "all",
    page: 1,
    pageSize: 25,
  });

  return (
    <MembersManager
      initialMembers={members}
      initialCounts={counts}
      initialTotal={total}
      initialPage={page}
      initialTotalPages={totalPages}
    />
  );
}
