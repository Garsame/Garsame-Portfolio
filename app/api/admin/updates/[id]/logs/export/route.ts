import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/dal";
import { exportMailLogsCsv } from "@/lib/admin/mail-logs";

export type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Props) {
  try {
    await requireAdmin();
    const { id } = await params;

    const csvContent = await exportMailLogsCsv(id);

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="mail-log-${id}.csv"`,
      },
    });
  } catch (err) {
    console.error("[api:admin:logs:export]", err);
    return NextResponse.json(
      { error: "Failed to export mail logs." },
      { status: 500 },
    );
  }
}
