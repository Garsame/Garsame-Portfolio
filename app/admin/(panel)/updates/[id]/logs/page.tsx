import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminContent, TopBar } from "@/components/admin/TopBar";
import { requireAdmin } from "@/lib/dal";
import { getBroadcastMailLogs } from "@/lib/admin/mail-logs";
import { MailLogsView } from "@/components/admin/updates/MailLogsView";
import { Button } from "@/components/ui";

export type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getBroadcastMailLogs(id);
  return {
    title: data
      ? `Mail Log · ${data.broadcast.subject}`
      : "Mail Log not found",
  };
}

export default async function BroadcastMailLogsPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const data = await getBroadcastMailLogs(id);
  if (!data) {
    notFound();
  }

  const formattedDate = data.broadcast.sentAt
    ? `Sent ${new Date(data.broadcast.sentAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : `Created ${new Date(data.broadcast.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;

  return (
    <>
      <TopBar
        title={`Mail log · ${data.broadcast.subject}`}
        subtitle={formattedDate}
        actions={
          <Button href="/admin/updates" variant="secondary" size="sm">
            Back to updates
          </Button>
        }
      />
      <AdminContent>
        <MailLogsView initialData={data} />
      </AdminContent>
    </>
  );
}
