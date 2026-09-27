import "server-only";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { Member, type IMember, type MEMBER_STATUSES } from "@/models";

export type AdminMemberView = {
  id: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  email: string;
  joinedAt: string;
  joinedFormatted: string;
  source?: string;
  status: (typeof MEMBER_STATUSES)[number];
  unsubToken: string;
};

export type MemberCounts = {
  all: number;
  active: number;
  unsubscribed: number;
};

export type ListMembersOptions = {
  filter?: "all" | "active" | "unsubscribed";
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listAdminMembers({
  filter = "all",
  search = "",
  page = 1,
  pageSize = 25,
}: ListMembersOptions = {}): Promise<{
  members: AdminMemberView[];
  counts: MemberCounts;
  total: number;
  page: number;
  totalPages: number;
}> {
  await requireAdmin();
  await dbConnect();

  const [activeCount, unsubscribedCount, totalCount] = await Promise.all([
    Member.countDocuments({ status: "active" }),
    Member.countDocuments({ status: "unsubscribed" }),
    Member.countDocuments({}),
  ]);

  const query: Record<string, unknown> = {};

  if (filter === "active") {
    query.status = "active";
  } else if (filter === "unsubscribed") {
    query.status = "unsubscribed";
  }

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { firstName: { $regex: s, $options: "i" } },
      { lastName: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
    ];
  }

  const filteredTotal = await Member.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  type LeanMember = IMember & { _id: unknown };

  const docs = (await Member.find(query)
    .sort({ joinedAt: -1 })
    .skip((currentPage - 1) * pageSize)
    .limit(pageSize)
    .lean()) as unknown as LeanMember[];

  const members: AdminMemberView[] = docs.map((doc) => {
    const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(" ");
    const joinedFormatted = doc.joinedAt
      ? new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "Africa/Mogadishu",
        }).format(new Date(doc.joinedAt))
      : "Unknown";

    return {
      id: String(doc._id),
      firstName: doc.firstName,
      lastName: doc.lastName,
      fullName,
      email: doc.email,
      joinedAt: doc.joinedAt ? new Date(doc.joinedAt).toISOString() : "",
      joinedFormatted,
      source: doc.source || "membership",
      status: doc.status || "active",
      unsubToken: doc.unsubToken || "",
    };
  });

  return {
    members,
    counts: {
      all: totalCount,
      active: activeCount,
      unsubscribed: unsubscribedCount,
    },
    total: filteredTotal,
    page: currentPage,
    totalPages,
  };
}

export async function deleteAdminMember(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await dbConnect();

  try {
    await Member.findByIdAndDelete(id);
    revalidatePath("/admin");
    revalidatePath("/admin/members");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove member.",
    };
  }
}

export async function toggleAdminMemberStatus(
  id: string,
  status: "active" | "unsubscribed",
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  await dbConnect();

  try {
    await Member.findByIdAndUpdate(id, {
      $set: {
        status,
        unsubscribedAt: status === "unsubscribed" ? new Date() : undefined,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/members");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update status.",
    };
  }
}

/**
 * Generates RFC 4180 compliant CSV string for member export.
 */
export async function generateMembersCsv(filter?: "all" | "active" | "unsubscribed"): Promise<string> {
  await requireAdmin();
  await dbConnect();

  const query: Record<string, unknown> = {};
  if (filter === "active") query.status = "active";
  if (filter === "unsubscribed") query.status = "unsubscribed";

  type LeanMember = IMember & { _id: unknown };

  const docs = (await Member.find(query)
    .sort({ joinedAt: -1 })
    .lean()) as unknown as LeanMember[];

  const headers = ["First Name", "Last Name", "Email", "Joined Date", "Source", "Status"];

  const escapeCsv = (val: unknown) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = docs.map((m) => [
    escapeCsv(m.firstName),
    escapeCsv(m.lastName || ""),
    escapeCsv(m.email),
    escapeCsv(m.joinedAt ? new Date(m.joinedAt).toISOString() : ""),
    escapeCsv(m.source || "membership"),
    escapeCsv(m.status || "active"),
  ]);

  return [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
