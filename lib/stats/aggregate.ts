import "server-only";

import { dbConnect } from "@/lib/db";
import { PageView, StatsDaily } from "@/models";

const TIME_ZONE = "Africa/Mogadishu";

/**
 * Returns YYYY-MM-DD for a given Date in Africa/Mogadishu time (UTC+3).
 */
export function getMogadishuDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

/**
 * Aggregates raw PageView records for a single calendar day (in Africa/Mogadishu time)
 * into StatsDaily records (both for individual paths and site-wide path "*").
 */
export async function aggregateStatsForDay(dateStr: string): Promise<void> {
  await dbConnect();

  const startOfDay = new Date(`${dateStr}T00:00:00+03:00`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999+03:00`);

  // Aggregation pipeline to group views, sessions, referrers, and devices by path
  const pathAggregates = await PageView.aggregate<{
    _id: string; // path
    views: number;
    sessions: string[];
    referrers: { host: string; views: number }[];
    phone: number;
    computer: number;
    tablet: number;
  }>([
    {
      $match: {
        viewedAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: "$path",
        views: { $sum: 1 },
        sessions: { $addToSet: "$sessionId" },
        referrerList: { $push: "$referrer" },
        phone: {
          $sum: { $cond: [{ $eq: ["$device", "Phone"] }, 1, 0] },
        },
        computer: {
          $sum: {
            $cond: [
              { $or: [{ $eq: ["$device", "Computer"] }, { $eq: ["$device", null] }] },
              1,
              0,
            ],
          },
        },
        tablet: {
          $sum: { $cond: [{ $eq: ["$device", "Tablet"] }, 1, 0] },
        },
      },
    },
  ]);

  if (pathAggregates.length === 0) {
    return;
  }

  let totalSiteViews = 0;
  const totalSiteSessions = new Set<string>();
  const totalSiteReferrers: Record<string, number> = {};
  let totalPhone = 0;
  let totalComputer = 0;
  let totalTablet = 0;

  for (const item of pathAggregates) {
    const path = item._id;
    const views = item.views;
    // Filter out null/undefined sessions
    const sessions = item.sessions.filter((s) => Boolean(s)).length;

    // Count referrers
    const refCounts: Record<string, number> = {};
    // @ts-expect-error item has referrerList from pipeline
    const refList: (string | undefined)[] = item.referrerList || [];
    for (const ref of refList) {
      const host = ref && ref.trim() !== "" ? ref : "Direct";
      refCounts[host] = (refCounts[host] || 0) + 1;
      totalSiteReferrers[host] = (totalSiteReferrers[host] || 0) + 1;
    }

    const referrers = Object.entries(refCounts)
      .map(([host, count]) => ({ host, views: count }))
      .sort((a, b) => b.views - a.views);

    totalSiteViews += views;
    item.sessions.forEach((s) => {
      if (s) totalSiteSessions.add(s);
    });
    totalPhone += item.phone || 0;
    totalComputer += item.computer || 0;
    totalTablet += item.tablet || 0;

    await StatsDaily.findOneAndUpdate(
      { date: dateStr, path },
      {
        $set: {
          views,
          sessions,
          referrers,
          devices: {
            phone: item.phone || 0,
            computer: item.computer || 0,
            tablet: item.tablet || 0,
          },
        },
      },
      { upsert: true, new: true },
    );
  }

  // Site-wide aggregate with path: "*"
  const siteReferrers = Object.entries(totalSiteReferrers)
    .map(([host, count]) => ({ host, views: count }))
    .sort((a, b) => b.views - a.views);

  await StatsDaily.findOneAndUpdate(
    { date: dateStr, path: "*" },
    {
      $set: {
        views: totalSiteViews,
        sessions: totalSiteSessions.size,
        referrers: siteReferrers,
        devices: {
          phone: totalPhone,
          computer: totalComputer,
          tablet: totalTablet,
        },
      },
    },
    { upsert: true, new: true },
  );
}

/**
 * Aggregates recent days to ensure stats are fresh when loaded in admin.
 */
export async function aggregateRecentStats(daysBack: number = 2): Promise<void> {
  const now = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;

  for (let i = 0; i <= daysBack; i++) {
    const targetDate = new Date(now.getTime() - i * DAY_MS);
    const dateStr = getMogadishuDateString(targetDate);
    await aggregateStatsForDay(dateStr);
  }
}
