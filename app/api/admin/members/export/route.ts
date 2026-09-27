import "server-only";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/dal";
import { generateMembersCsv } from "@/lib/admin/members";

export async function GET(request: Request) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const filter = (searchParams.get("filter") || "all") as
    | "all"
    | "active"
    | "unsubscribed";

  const csvContent = await generateMembersCsv(filter);
  const dateStr = new Date().toISOString().split("T")[0];

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="garsame-members-${filter}-${dateStr}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
