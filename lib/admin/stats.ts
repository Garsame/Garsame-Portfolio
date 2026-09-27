import "server-only";

import { cache } from "react";
import { dbConnect } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { Member, Message, StatsDaily } from "@/models";
import { aggregateRecentStats, getMogadishuDateString } from "@/lib/stats/aggregate";

const DAY_MS = 24 * 60 * 60 * 1000;

export type StatsRange = 7 | 30 | 90;

export type AdminStatsData = {
  range: StatsRange;
  overview: {
    pageViews: {
      value: number;
      changeText: string;
      isPositive: boolean;
    };
    visitors: {
      value: number;
      changeText: string;
      isPositive: boolean;
    };
    newMembers: {
      value: number;
      changeText: string;
      isPositive: boolean;
    };
    enquiries: {
      value: number;
      note: string;
    };
  };
  chart: {
    days: string[];
    views: number[];
    labels: string[];
    pathD: string;
    areaD: string;
    maxViews: number;
  };
  mostReadPages: {
    path: string;
    views: number;
    pctOfMax: number;
  }[];
  referrers: {
    host: string;
    percentage: number;
  }[];
  devices: {
    phonePct: number;
    computerPct: number;
    tabletPct: number;
    takeaway: string;
  };
};

/** Format date string "YYYY-MM-DD" to "17 AUG" */
function formatTickDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const monthNames = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
  ];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  return `${day} ${monthNames[monthIdx] || ""}`;
}

export const getAdminStats = cache(async (range: StatsRange = 30): Promise<AdminStatsData> => {
  await requireAdmin();
  await dbConnect();

  // Run quick aggregation for the last 2 days so current visits are included
  try {
    await aggregateRecentStats(2);
  } catch (err) {
    console.error("[getAdminStats:aggregateRecentStats]", err);
  }

  const now = new Date();
  const currentDayKeys: string[] = [];
  const previousDayKeys: string[] = [];

  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    currentDayKeys.push(getMogadishuDateString(d));
  }

  for (let i = range * 2 - 1; i >= range; i--) {
    const d = new Date(now.getTime() - i * DAY_MS);
    previousDayKeys.push(getMogadishuDateString(d));
  }

  const currentStartDate = new Date(`${currentDayKeys[0]}T00:00:00+03:00`);
  const previousStartDate = new Date(`${previousDayKeys[0]}T00:00:00+03:00`);

  const [
    currentSiteRows,
    previousSiteRows,
    currentPageRows,
    currentMembersCount,
    previousMembersCount,
    currentMessagesCount,
  ] = await Promise.all([
    // Current site-wide stats
    StatsDaily.find({ path: "*", date: { $in: currentDayKeys } })
      .select("date views sessions referrers devices")
      .lean<{
        date: string;
        views: number;
        sessions: number;
        referrers: { host: string; views: number }[];
        devices?: { phone: number; computer: number; tablet: number };
      }[]>(),

    // Previous period site-wide stats
    StatsDaily.find({ path: "*", date: { $in: previousDayKeys } })
      .select("date views sessions")
      .lean<{ date: string; views: number; sessions: number }[]>(),

    // Current individual page stats
    StatsDaily.find({ path: { $ne: "*" }, date: { $in: currentDayKeys } })
      .select("path views")
      .lean<{ path: string; views: number }[]>(),

    // Members joined in current period
    Member.countDocuments({ joinedAt: { $gte: currentStartDate } }),

    // Members joined in previous period
    Member.countDocuments({
      joinedAt: { $gte: previousStartDate, $lt: currentStartDate },
    }),

    // Messages received in current period
    Message.countDocuments({ createdAt: { $gte: currentStartDate } }),
  ]);

  // Map day to views
  const currentSiteMap = new Map(currentSiteRows.map((r) => [r.date, r]));
  const dailyViews: number[] = [];
  let totalViews = 0;
  let totalSessions = 0;

  let totalPhone = 0;
  let totalComputer = 0;
  let totalTablet = 0;
  const combinedReferrers: Record<string, number> = {};

  for (const dateKey of currentDayKeys) {
    const row = currentSiteMap.get(dateKey);
    const views = row?.views || 0;
    const sessions = row?.sessions || 0;
    dailyViews.push(views);
    totalViews += views;
    totalSessions += sessions;

    if (row?.devices) {
      totalPhone += row.devices.phone || 0;
      totalComputer += row.devices.computer || 0;
      totalTablet += row.devices.tablet || 0;
    }

    if (row?.referrers) {
      for (const ref of row.referrers) {
        combinedReferrers[ref.host] =
          (combinedReferrers[ref.host] || 0) + ref.views;
      }
    }
  }

  // Previous period totals
  let prevTotalViews = 0;
  let prevTotalSessions = 0;
  for (const r of previousSiteRows) {
    prevTotalViews += r.views || 0;
    prevTotalSessions += r.sessions || 0;
  }

  // Page views % change
  const viewDelta =
    prevTotalViews > 0
      ? Math.round(((totalViews - prevTotalViews) / prevTotalViews) * 100)
      : totalViews > 0
        ? 100
        : 0;
  const viewChangeText =
    viewDelta >= 0
      ? `+${viewDelta}% on last ${range === 7 ? "week" : range === 30 ? "month" : "period"}`
      : `${viewDelta}% on last ${range === 7 ? "week" : range === 30 ? "month" : "period"}`;

  // Visitors % change
  const visitorDelta =
    prevTotalSessions > 0
      ? Math.round(((totalSessions - prevTotalSessions) / prevTotalSessions) * 100)
      : totalSessions > 0
        ? 100
        : 0;
  const visitorChangeText = visitorDelta >= 0 ? `+${visitorDelta}%` : `${visitorDelta}%`;

  // New members change
  const memberDiff = currentMembersCount - previousMembersCount;
  const memberChangeText =
    memberDiff >= 0
      ? `+${memberDiff} on last ${range === 7 ? "week" : range === 30 ? "month" : "period"}`
      : `${memberDiff} on last ${range === 7 ? "week" : range === 30 ? "month" : "period"}`;

  // Enquiries conversion
  const enquiryNote =
    totalSessions > 0 && currentMessagesCount > 0
      ? `1 in every ${Math.max(1, Math.round(totalSessions / currentMessagesCount))} visitors`
      : totalSessions > 0
        ? "no enquiries this period"
        : "awaiting visitors";

  // Build SVG Chart Paths (1060 width x 190 height coordinate space matching design/31-admin-stats.html)
  const svgWidth = 1060;
  const svgHeight = 190;
  const topPadding = 16;
  const bottomPadding = 20;
  const availableHeight = svgHeight - topPadding - bottomPadding;

  const maxViews = Math.max(...dailyViews, 10);
  const pointCount = dailyViews.length;

  const points: { x: number; y: number }[] = dailyViews.map((v, i) => {
    const x = pointCount > 1 ? (i / (pointCount - 1)) * svgWidth : 0;
    const y = topPadding + (1 - v / maxViews) * availableHeight;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });

  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }
  }

  const areaD = pathD
    ? `${pathD} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`
    : "";

  // 5 Tick Labels across the range
  const labelIndices = [
    0,
    Math.floor(pointCount * 0.25),
    Math.floor(pointCount * 0.5),
    Math.floor(pointCount * 0.75),
    pointCount - 1,
  ];
  const chartLabels = labelIndices.map((idx) =>
    formatTickDate(currentDayKeys[idx] || "")
  );

  // Most read pages
  const pageViewSums: Record<string, number> = {};
  for (const row of currentPageRows) {
    pageViewSums[row.path] = (pageViewSums[row.path] || 0) + row.views;
  }

  const sortedPages = Object.entries(pageViewSums)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const highestPageView = sortedPages[0]?.views || 1;
  const mostReadPages = sortedPages.map((p) => ({
    path: p.path,
    views: p.views,
    pctOfMax: Math.max(12, Math.round((p.views / highestPageView) * 100)),
  }));

  // Where they came from (referrers)
  const totalRefViews = Object.values(combinedReferrers).reduce(
    (acc, v) => acc + v,
    0
  );

  let sortedReferrers = Object.entries(combinedReferrers)
    .map(([host, count]) => ({
      host,
      percentage:
        totalRefViews > 0 ? Math.round((count / totalRefViews) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  if (sortedReferrers.length === 0) {
    sortedReferrers = [{ host: "Direct", percentage: 100 }];
  }

  // Device distribution
  const totalDeviceViews = totalPhone + totalComputer + totalTablet;
  let phonePct = 74;
  let computerPct = 22;
  let tabletPct = 4;

  if (totalDeviceViews > 0) {
    phonePct = Math.round((totalPhone / totalDeviceViews) * 100);
    computerPct = Math.round((totalComputer / totalDeviceViews) * 100);
    tabletPct = Math.max(0, 100 - phonePct - computerPct);
  }

  let takeaway =
    "Three in four visitors are on a phone. Check every change at phone width before publishing it.";
  if (phonePct > 60) {
    takeaway = `Over ${phonePct}% of visitors are on a mobile device. Check every change at phone width before publishing it.`;
  } else if (phonePct < 40) {
    takeaway = `Most visitors are viewing from desktop browsers. Ensure case studies and typography look optimal on wide screens.`;
  }

  return {
    range,
    overview: {
      pageViews: {
        value: totalViews,
        changeText: viewChangeText,
        isPositive: viewDelta >= 0,
      },
      visitors: {
        value: totalSessions,
        changeText: visitorChangeText,
        isPositive: visitorDelta >= 0,
      },
      newMembers: {
        value: currentMembersCount,
        changeText: memberChangeText,
        isPositive: memberDiff >= 0,
      },
      enquiries: {
        value: currentMessagesCount,
        note: enquiryNote,
      },
    },
    chart: {
      days: currentDayKeys,
      views: dailyViews,
      labels: chartLabels,
      pathD,
      areaD,
      maxViews,
    },
    mostReadPages,
    referrers: sortedReferrers,
    devices: {
      phonePct,
      computerPct,
      tabletPct,
      takeaway,
    },
  };
});
