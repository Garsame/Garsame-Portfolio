import "server-only";

import { cache } from "react";
import { dbConnect } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import type { SidebarCounts } from "@/lib/admin/nav";
import {
  MailLog,
  Member,
  Message,
  Post,
  Project,
  StatsDaily,
  Testimonial,
} from "@/models";

/**
 * Everything the dashboard shows — docs/04-ADMIN.md §1, "the one screen that
 * answers what is happening". Real counts from the database.
 *
 * Every function starts with requireAdmin(): the auth check sits next to the
 * data, so no page can render these numbers for someone who is not signed in,
 * whatever the layout or the proxy did.
 */

const TIME_ZONE = "Africa/Mogadishu";
const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD for an instant, in Mogadishu time. */
const dayKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);

/** The last `n` days ending today, oldest first, in Mogadishu time. */
function lastDays(n: number, now: Date): string[] {
  return Array.from({ length: n }, (_, i) =>
    dayKey(new Date(now.getTime() - (n - 1 - i) * DAY_MS)),
  );
}

/** Midnight at the start of a Mogadishu day. Mogadishu is UTC+3, no DST. */
const startOfDay = (key: string) => new Date(`${key}T00:00:00+03:00`);

/* ---------------------------------------------------------------- sidebar */

export const getSidebarCounts = cache(async (): Promise<SidebarCounts> => {
  await requireAdmin();
  await dbConnect();
  const [members, pendingTestimonials, unreadMessages] = await Promise.all([
    Member.countDocuments({ status: "active" }),
    Testimonial.countDocuments({ status: "pending" }),
    Message.countDocuments({ read: false, archived: false }),
  ]);
  return { members, pendingTestimonials, unreadMessages };
});

/* -------------------------------------------------------------- dashboard */

export type AttentionItem = {
  tone: "warning" | "accent" | "danger" | "neutral";
  text: string;
  action: string;
  href: string;
};

export type ActivityItem = {
  kind: "member" | "message" | "testimonial" | "post";
  text: string;
  at: Date;
};

export type Dashboard = {
  now: Date;
  tiles: {
    members: { total: number; newThisWeek: number };
    messages: { unread: number; oldestUnread: Date | null };
    testimonials: { pending: number };
    posts: { published: number; drafts: number };
  };
  memberGrowth: { days: string[]; totals: number[] };
  pageViews: { days: string[]; views: number[]; total: number };
  attention: AttentionItem[];
  activity: ActivityItem[];
};

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** "2 days", "5 hours", "a few minutes" — for the attention list. */
export function ageInWords(from: Date, now: Date): string {
  const hours = Math.floor((now.getTime() - from.getTime()) / 3_600_000);
  if (hours < 1) return "a few minutes";
  if (hours < 24) return plural(hours, "hour");
  return plural(Math.floor(hours / 24), "day");
}

export const getDashboard = cache(async (): Promise<Dashboard> => {
  await requireAdmin();
  await dbConnect();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const monthAgo = new Date(now.getTime() - 30 * DAY_MS);

  const growthDays = lastDays(90, now);
  const growthStart = startOfDay(growthDays[0]);
  const viewDays = lastDays(30, now);

  const [
    activeMembers,
    newThisWeek,
    unread,
    oldestUnread,
    pending,
    published,
    drafts,
    failedSends,
    staleDraftPosts,
    staleDraftProjects,
    joinedBefore,
    leftBefore,
    joinsByDay,
    leavesByDay,
    viewRows,
    recentMembers,
    recentMessages,
    recentTestimonials,
    recentPosts,
  ] = await Promise.all([
    Member.countDocuments({ status: "active" }),
    Member.countDocuments({ status: "active", joinedAt: { $gte: weekAgo } }),
    Message.countDocuments({ read: false, archived: false }),
    Message.findOne({ read: false, archived: false })
      .sort({ createdAt: 1 })
      .select("createdAt")
      .lean<{ createdAt: Date }>(),
    Testimonial.countDocuments({ status: "pending" }),
    Post.countDocuments({ state: "published" }),
    Post.countDocuments({ state: "draft" }),
    MailLog.countDocuments({ status: "failed" }),
    Post.find({ state: "draft", updatedAt: { $lt: monthAgo } })
      .sort({ updatedAt: 1 })
      .select("updatedAt")
      .lean<{ updatedAt: Date }[]>(),
    Project.find({ state: "draft", updatedAt: { $lt: monthAgo } })
      .sort({ updatedAt: 1 })
      .select("updatedAt")
      .lean<{ updatedAt: Date }[]>(),

    /* member growth: the count on the first day, then the daily changes */
    Member.countDocuments({ joinedAt: { $lt: growthStart } }),
    Member.countDocuments({
      status: "unsubscribed",
      unsubscribedAt: { $lt: growthStart },
    }),
    Member.aggregate<{ _id: string; n: number }>([
      { $match: { joinedAt: { $gte: growthStart } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$joinedAt",
              timezone: TIME_ZONE,
            },
          },
          n: { $sum: 1 },
        },
      },
    ]),
    Member.aggregate<{ _id: string; n: number }>([
      {
        $match: {
          status: "unsubscribed",
          unsubscribedAt: { $gte: growthStart },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$unsubscribedAt",
              timezone: TIME_ZONE,
            },
          },
          n: { $sum: 1 },
        },
      },
    ]),

    /* page views: the nightly totals for the whole site, path "*" */
    StatsDaily.find({ path: "*", date: { $gte: viewDays[0] } })
      .select("date views")
      .lean<{ date: string; views: number }[]>(),

    /* recent activity — docs/04-ADMIN.md names these four kinds */
    Member.find()
      .sort({ joinedAt: -1 })
      .limit(10)
      .select("firstName lastName joinedAt")
      .lean<{ firstName: string; lastName?: string; joinedAt: Date }[]>(),
    Message.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name business createdAt")
      .lean<{ name: string; business?: string; createdAt: Date }[]>(),
    Testimonial.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("name createdAt")
      .lean<{ name: string; createdAt: Date }[]>(),
    Post.find({ state: "published", publishedAt: { $ne: null } })
      .sort({ publishedAt: -1 })
      .limit(10)
      .select("title publishedAt")
      .lean<{ title: string; publishedAt: Date }[]>(),
  ]);

  /* ---- member growth ---- */
  const joins = new Map(joinsByDay.map((r) => [r._id, r.n]));
  const leaves = new Map(leavesByDay.map((r) => [r._id, r.n]));
  let running = joinedBefore - leftBefore;
  const totals = growthDays.map((day) => {
    running += (joins.get(day) ?? 0) - (leaves.get(day) ?? 0);
    return running;
  });

  /* ---- page views ---- */
  const viewsByDay = new Map(viewRows.map((r) => [r.date, r.views]));
  const views = viewDays.map((day) => viewsByDay.get(day) ?? 0);

  /* ---- needs your attention ---- */
  const attention: AttentionItem[] = [];
  if (pending > 0) {
    attention.push({
      tone: "warning",
      text: `${plural(pending, "testimonial")} waiting for approval`,
      action: "Review",
      href: "/admin/testimonials",
    });
  }
  if (unread > 0) {
    const age = oldestUnread
      ? `, oldest ${ageInWords(oldestUnread.createdAt, now)}`
      : "";
    attention.push({
      tone: "accent",
      text: `${plural(unread, "unread message")}${age}`,
      action: "Open",
      href: "/admin/messages",
    });
  }
  if (failedSends > 0) {
    attention.push({
      tone: "danger",
      text: `${plural(failedSends, "email")} failed to send`,
      action: "Retry",
      href: "/admin/updates",
    });
  }
  const stale = [
    ...staleDraftPosts.map((d) => ({ at: d.updatedAt, href: "/admin/blog" })),
    ...staleDraftProjects.map((d) => ({
      at: d.updatedAt,
      href: "/admin/projects",
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  if (stale.length > 0) {
    attention.push({
      tone: "neutral",
      text: `${plural(stale.length, "draft")} untouched for ${ageInWords(stale[0].at, now)}`,
      action: "Open",
      href: stale[0].href,
    });
  }

  /* ---- recent activity: the ten newest across all four kinds ---- */
  const activity: ActivityItem[] = [
    ...recentMembers.map((m) => ({
      kind: "member" as const,
      text: `${[m.firstName, m.lastName].filter(Boolean).join(" ")} joined as a member`,
      at: m.joinedAt,
    })),
    ...recentMessages.map((m) => ({
      kind: "message" as const,
      text: `New message from ${m.business || m.name}`,
      at: m.createdAt,
    })),
    ...recentTestimonials.map((t) => ({
      kind: "testimonial" as const,
      text: `Testimonial submitted by ${t.name}`,
      at: t.createdAt,
    })),
    ...recentPosts.map((p) => ({
      kind: "post" as const,
      text: `Post published: ${p.title}`,
      at: p.publishedAt,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10);

  return {
    now,
    tiles: {
      members: { total: activeMembers, newThisWeek },
      messages: { unread, oldestUnread: oldestUnread?.createdAt ?? null },
      testimonials: { pending },
      posts: { published, drafts },
    },
    memberGrowth: { days: growthDays, totals },
    pageViews: {
      days: viewDays,
      views,
      total: views.reduce((sum, v) => sum + v, 0),
    },
    attention,
    activity,
  };
});
