import type { Metadata } from "next";
import { Button } from "@/components/ui";
import { AdminContent, TopBar } from "@/components/admin/TopBar";
import {
  ActivityList,
  AttentionList,
  MembersChart,
  StatTile,
  ViewsChart,
} from "@/components/admin/dashboard";
import { ageInWords, getDashboard } from "@/lib/admin/dashboard";

/**
 * The dashboard — docs/04-ADMIN.md §1; design/21-admin-dashboard.html.
 * Every number is a live count. getDashboard() checks the session itself.
 */

export const metadata: Metadata = { title: "Dashboard" };

const today = (now: Date) => {
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", {
      ...options,
      timeZone: "Africa/Mogadishu",
    }).format(now);
  return `${part({ weekday: "long" })}, ${part({ day: "numeric" })} ${part({ month: "long" })} ${part({ year: "numeric" })}`;
};

export default async function DashboardPage() {
  const d = await getDashboard();
  const { members, messages, testimonials, posts } = d.tiles;

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle={today(d.now)}
        actions={
          <>
            <span className="hidden sm:block">
              <Button href="/" variant="secondary" size="xs" newTab>
                View site
              </Button>
            </span>
            <Button href="/admin/blog" size="xs">
              New post
            </Button>
          </>
        }
      />

      <AdminContent>
        <section
          aria-label="At a glance"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatTile
            label="Members"
            value={members.total}
            tone={members.newThisWeek > 0 ? "success" : "neutral"}
            note={
              members.newThisWeek > 0
                ? `+${members.newThisWeek} this week`
                : "none new this week"
            }
          />
          <StatTile
            label="Unread messages"
            value={messages.unread}
            tone={messages.unread > 0 ? "warning" : "neutral"}
            note={
              messages.oldestUnread
                ? `oldest is ${ageInWords(messages.oldestUnread, d.now)} old`
                : "inbox clear"
            }
          />
          <StatTile
            label="Pending testimonials"
            value={testimonials.pending}
            tone={testimonials.pending > 0 ? "accent" : "neutral"}
            note={
              testimonials.pending > 0 ? "waiting for you" : "nothing waiting"
            }
          />
          <StatTile
            label="Published posts"
            value={posts.published}
            tone="neutral"
            note={`${posts.drafts} ${posts.drafts === 1 ? "draft" : "drafts"}`}
          />
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <MembersChart
            days={d.memberGrowth.days}
            totals={d.memberGrowth.totals}
          />
          <ViewsChart
            days={d.pageViews.days}
            views={d.pageViews.views}
            total={d.pageViews.total}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <AttentionList items={d.attention} />
          <ActivityList items={d.activity} now={d.now} />
        </div>
      </AdminContent>
    </>
  );
}
