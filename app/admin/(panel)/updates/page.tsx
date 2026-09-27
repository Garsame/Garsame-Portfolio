import type { Metadata } from "next";
import { AdminContent, TopBar } from "@/components/admin/TopBar";
import { requireAdmin } from "@/lib/dal";
import { getBroadcasts } from "@/lib/admin/updates";
import { UpdatesManager } from "@/components/admin/updates/UpdatesManager";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Updates",
};

export default async function AdminUpdatesPage() {
  await requireAdmin();

  const { broadcasts, counts, activeMembersCount } = await getBroadcasts();

  const subtitle = `${activeMembersCount} active members · ${counts.sent} sent · ${counts.drafts} drafts`;

  return (
    <>
      <TopBar
        title="Updates"
        subtitle={subtitle}
        actions={
          <Button href="/admin/updates/new" size="sm">
            New update
          </Button>
        }
      />
      <AdminContent>
        <UpdatesManager
          initialBroadcasts={broadcasts}
          counts={counts}
        />
      </AdminContent>
    </>
  );
}
