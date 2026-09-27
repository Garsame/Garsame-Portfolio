import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import {
  getActiveMemberCount,
  getPastUpdatesSummary,
} from "@/lib/admin/updates";
import { getResolvedSmtpConfig } from "@/lib/email/mailer";
import { UpdateEditor } from "@/components/admin/updates/UpdateEditor";

export const metadata: Metadata = {
  title: "New update — Admin",
};

export default async function NewUpdatePage() {
  await requireAdmin();

  const [activeMembersCount, pastUpdates, smtpConfig] = await Promise.all([
    getActiveMemberCount(),
    getPastUpdatesSummary(5),
    getResolvedSmtpConfig(),
  ]);

  return (
    <UpdateEditor
      activeMembersCount={activeMembersCount}
      pastUpdates={pastUpdates}
      fromEmail={smtpConfig.fromEmail || "garsame40@gmail.com"}
    />
  );
}
