import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import {
  getActiveMemberCount,
  getBroadcastById,
  getPastUpdatesSummary,
} from "@/lib/admin/updates";
import { getResolvedSmtpConfig } from "@/lib/email/mailer";
import { UpdateEditor } from "@/components/admin/updates/UpdateEditor";

export type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const broadcast = await getBroadcastById(id);
  return {
    title: broadcast ? `Edit: ${broadcast.subject}` : "Update not found",
  };
}

export default async function EditUpdatePage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;

  const [broadcast, activeMembersCount, pastUpdates, smtpConfig] =
    await Promise.all([
      getBroadcastById(id),
      getActiveMemberCount(),
      getPastUpdatesSummary(5),
      getResolvedSmtpConfig(),
    ]);

  if (!broadcast) {
    notFound();
  }

  return (
    <UpdateEditor
      initialBroadcast={broadcast}
      activeMembersCount={activeMembersCount}
      pastUpdates={pastUpdates}
      fromEmail={smtpConfig.fromEmail || "garsame40@gmail.com"}
    />
  );
}
