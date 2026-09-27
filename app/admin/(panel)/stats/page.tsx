import type { Metadata } from "next";
import { AdminContent, TopBar } from "@/components/admin/TopBar";
import { StatsManager } from "@/components/admin/stats/StatsManager";
import { getAdminStats, type StatsRange } from "@/lib/admin/stats";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Stats",
};

type Props = {
  searchParams: Promise<{ range?: string }>;
};

export default async function AdminStatsPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const rawRange = Number(params.range);
  const range: StatsRange = rawRange === 7 || rawRange === 90 ? rawRange : 30;

  const data = await getAdminStats(range);

  return (
    <>
      <TopBar
        title="Stats"
        subtitle="COUNTED ON YOUR OWN SERVER · NO THIRD-PARTY TRACKING"
      />
      <AdminContent>
        <StatsManager initialData={data} />
      </AdminContent>
    </>
  );
}
