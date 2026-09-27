import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ActivityItem, AttentionItem } from "@/lib/admin/dashboard";
import { AlertCircle, AlertTriangle, ClockIcon, MailIcon } from "./icons";
import { Panel } from "./TopBar";

/**
 * The dashboard's pieces — design/21-admin-dashboard.html.
 *
 * The charts are hand-drawn SVG. CLAUDE.md allows no component library, a
 * chart library would be the heaviest dependency in the admin, and two simple
 * charts do not need one. Each carries a text summary for screen readers.
 */

const TIME_ZONE = "Africa/Mogadishu";

/* ------------------------------------------------------------------ tiles */

export function StatTile({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: number;
  note: string;
  tone: "success" | "warning" | "accent" | "neutral";
}) {
  const toneClass = {
    success: "text-success",
    warning: "text-warning",
    accent: "text-blue",
    neutral: "text-ink-body",
  }[tone];

  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-white p-5">
      <span className="font-mono text-mono-chip tracking-wide text-muted uppercase">
        {label}
      </span>
      <span className="text-stat text-ink">
        {value.toLocaleString("en-GB")}
      </span>
      <span className={cn("text-fine font-semibold", toneClass)}>{note}</span>
    </div>
  );
}

/* -------------------------------------------------------------- line chart */

/* Three letters, as drawn. Intl's en-GB short month is "Sept", so the labels
   come straight from the YYYY-MM-DD key, which is already Mogadishu time. */
const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

const monthLabel = (dayKey: string) => MONTHS[Number(dayKey.slice(5, 7)) - 1];

const shortDate = (dayKey: string) =>
  `${Number(dayKey.slice(8, 10))} ${monthLabel(dayKey)}`;

export function MembersChart({
  days,
  totals,
}: {
  days: string[];
  totals: number[];
}) {
  const W = 640;
  const H = 170;
  const TOP = 12;
  const BOTTOM = 162;
  /* 10% headroom so a line at its highest does not touch the top edge. */
  const max = Math.max(1, ...totals) * 1.1;
  const x = (i: number) =>
    totals.length > 1 ? (i / (totals.length - 1)) * W : 0;
  const y = (v: number) => BOTTOM - (v / max) * (BOTTOM - TOP);

  const line = totals
    .map(
      (v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  const last = totals.at(-1) ?? 0;
  const first = totals[0] ?? 0;

  /* One label per calendar month in range, as the design shows. */
  const months = [...new Set(days.map(monthLabel))];

  return (
    <Panel
      title="Members over the last 90 days"
      meta={`${last.toLocaleString("en-GB")} total`}
    >
      <div className="relative h-42.5">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`Member count over 90 days, from ${first} to ${last}.`}
        >
          {[8, 48, 88, 128].map((gy) => (
            <line
              key={gy}
              x1="0"
              x2={W}
              y1={gy}
              y2={gy}
              className="stroke-border-faint"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={area} className="fill-accent-soft" />
          <path
            d={line}
            fill="none"
            className="stroke-blue"
            strokeWidth="2.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* The end dot is HTML, not SVG: the chart stretches to its width, and
            a circle inside a stretched SVG would draw as an ellipse. */}
        <span
          aria-hidden="true"
          className="absolute right-0 size-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-blue"
          style={{ top: `${(y(last) / H) * 100}%` }}
        />
      </div>
      <div className="flex justify-between font-mono text-mono-chip tracking-none text-faint">
        {months.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </Panel>
  );
}

/* --------------------------------------------------------------- bar chart */

export function ViewsChart({
  days,
  views,
  total,
}: {
  days: string[];
  views: number[];
  total: number;
}) {
  const max = Math.max(1, ...views);
  /* The three busiest days are drawn in blue, as in the design. */
  const topThree = new Set(
    views
      .map((v, i) => ({ v, i }))
      .filter((d) => d.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 3)
      .map((d) => d.i),
  );
  const labelAt = [0, 10, 20, days.length - 1];

  return (
    <Panel title="Page views, 30 days" meta={total.toLocaleString("en-GB")}>
      <div className="relative">
        <div
          className="flex h-42.5 items-end gap-1 border-b border-border-faint sm:gap-1.5"
          role="img"
          aria-label={
            total > 0
              ? `${total} page views in the last 30 days.`
              : "No page views recorded in the last 30 days."
          }
        >
          {views.map((v, i) => (
            <div
              key={days[i]}
              className={cn(
                "flex-1 rounded-t-bar",
                topThree.has(i) ? "bg-blue" : "bg-border-strong",
              )}
              style={{ height: `${(v / max) * 100}%` }}
            />
          ))}
        </div>
        {total === 0 ? (
          <p className="absolute inset-0 flex items-center justify-center text-caption text-muted">
            No page views recorded yet.
          </p>
        ) : null}
      </div>
      <div className="flex justify-between font-mono text-mono-chip tracking-none text-faint">
        {labelAt.map((i) => (
          <span key={i}>
            {i === days.length - 1 ? "TODAY" : shortDate(days[i])}
          </span>
        ))}
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------- attention list */

const ATTENTION = {
  warning: {
    box: "bg-warning-bg",
    icon: "text-warning",
    text: "text-warning-ink",
    action: "text-warning",
    Icon: AlertTriangle,
  },
  accent: {
    box: "bg-accent-soft",
    icon: "text-blue",
    text: "text-accent-ink",
    action: "text-blue",
    Icon: MailIcon,
  },
  danger: {
    box: "bg-danger-bg",
    icon: "text-danger",
    text: "text-danger-ink",
    action: "text-danger",
    Icon: AlertCircle,
  },
  neutral: {
    box: "bg-tint",
    icon: "text-muted-strong",
    text: "text-ink-3",
    action: "text-muted-strong",
    Icon: ClockIcon,
  },
} as const;

export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <Panel title="Needs your attention">
      {items.length === 0 ? (
        <p className="text-caption text-ink-body">
          Nothing needs your attention.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.25">
          {items.map((item) => {
            const t = ATTENTION[item.tone];
            return (
              <li key={item.text}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-input px-3.75 py-3.25 transition-button hover:opacity-90",
                    t.box,
                  )}
                >
                  <t.Icon className={cn("shrink-0", t.icon)} />
                  <span className={cn("flex-1 text-caption", t.text)}>
                    {item.text}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-mono-meta font-regular tracking-none",
                      t.action,
                    )}
                  >
                    {item.action} →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ----------------------------------------------------------- activity list */

const DOT: Record<ActivityItem["kind"], string> = {
  member: "bg-success",
  message: "bg-blue",
  testimonial: "bg-warning",
  post: "bg-muted",
};

function sinceShort(at: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function ActivityList({
  items,
  now,
}: {
  items: ActivityItem[];
  now: Date;
}) {
  const full = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIME_ZONE,
  });

  return (
    <Panel title="Recent activity">
      {items.length === 0 ? (
        <p className="text-caption text-ink-body">No activity yet.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item, i) => (
            <li
              key={`${item.kind}-${item.at.getTime()}-${i}`}
              className="flex items-center gap-3 border-b border-border-faint py-2.75 last:border-b-0"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.75 shrink-0 rounded-full",
                  DOT[item.kind],
                )}
              />
              <span className="flex-1 text-caption text-ink-2">
                {item.text}
              </span>
              <time
                dateTime={item.at.toISOString()}
                title={full.format(item.at)}
                className="shrink-0 font-mono text-mono-meta font-regular tracking-none text-faint"
              >
                {sinceShort(item.at, now)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
