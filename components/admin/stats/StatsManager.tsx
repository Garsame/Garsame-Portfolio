"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AdminStatsData, StatsRange } from "@/lib/admin/stats";

type Props = {
  initialData: AdminStatsData;
};

export function StatsManager({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentRange = (Number(searchParams.get("range")) || initialData.range) as StatsRange;

  const handleRangeChange = (range: StatsRange) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", range.toString());
      router.push(`/admin/stats?${params.toString()}`);
    });
  };

  const { overview, chart, mostReadPages, referrers, devices } = initialData;

  return (
    <div className={`flex flex-col gap-5 ${isPending ? "opacity-70 transition-opacity" : ""}`}>
      {/* ------------------------------------------------ Top Switcher Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-h4 font-bold text-ink">Overview</span>
          <span className="font-mono text-xs text-ink-muted">
            counted on your own server · zero external trackers
          </span>
        </div>
        <div className="flex items-center gap-2">
          {([7, 30, 90] as StatsRange[]).map((r) => {
            const active = currentRange === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => handleRangeChange(r)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-blue text-white shadow-xs"
                    : "border border-border bg-white text-ink-body hover:bg-tint-soft"
                }`}
              >
                {r} days
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------ Four Metric Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Page views */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-white p-5 shadow-xs">
          <span className="font-mono text-[10px] tracking-wider text-ink-muted uppercase">
            Page Views
          </span>
          <span className="font-mono text-3xl font-extrabold text-ink">
            {overview.pageViews.value.toLocaleString()}
          </span>
          <span
            className={`text-xs font-semibold ${
              overview.pageViews.isPositive ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {overview.pageViews.changeText}
          </span>
        </div>

        {/* Visitors */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-white p-5 shadow-xs">
          <span className="font-mono text-[10px] tracking-wider text-ink-muted uppercase">
            Visitors
          </span>
          <span className="font-mono text-3xl font-extrabold text-ink">
            {overview.visitors.value.toLocaleString()}
          </span>
          <span
            className={`text-xs font-semibold ${
              overview.visitors.isPositive ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {overview.visitors.changeText}
          </span>
        </div>

        {/* New Members */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-white p-5 shadow-xs">
          <span className="font-mono text-[10px] tracking-wider text-ink-muted uppercase">
            New Members
          </span>
          <span className="font-mono text-3xl font-extrabold text-ink">
            {overview.newMembers.value.toLocaleString()}
          </span>
          <span
            className={`text-xs font-semibold ${
              overview.newMembers.isPositive ? "text-emerald-700" : "text-ink-body"
            }`}
          >
            {overview.newMembers.changeText}
          </span>
        </div>

        {/* Enquiries */}
        <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-white p-5 shadow-xs">
          <span className="font-mono text-[10px] tracking-wider text-ink-muted uppercase">
            Enquiries
          </span>
          <span className="font-mono text-3xl font-extrabold text-ink">
            {overview.enquiries.value.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-ink-muted">
            {overview.enquiries.note}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------ Views Per Day Chart */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink">Views per day</span>
          <div className="flex items-center gap-1.5 font-mono text-xs text-ink-muted">
            <span className="size-2 rounded-xs bg-blue" />
            <span>views</span>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg
            width="100%"
            height="190"
            viewBox="0 0 1060 190"
            preserveAspectRatio="none"
            className="w-full"
          >
            {/* Grid lines */}
            <line x1="0" y1="10" x2="1060" y2="10" stroke="#F1F4FD" strokeWidth="1" />
            <line x1="0" y1="55" x2="1060" y2="55" stroke="#F1F4FD" strokeWidth="1" />
            <line x1="0" y1="100" x2="1060" y2="100" stroke="#F1F4FD" strokeWidth="1" />
            <line x1="0" y1="145" x2="1060" y2="145" stroke="#F1F4FD" strokeWidth="1" />

            {/* Filled area */}
            {chart.areaD && (
              <path d={chart.areaD} fill="#EDF0FE" className="transition-all duration-300" />
            )}

            {/* Line stroke */}
            {chart.pathD && (
              <path
                d={chart.pathD}
                fill="none"
                stroke="#3D5AF1"
                strokeWidth="2.5"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />
            )}
          </svg>
        </div>

        {/* Date labels along bottom */}
        <div className="flex justify-between font-mono text-[11px] text-ink-muted">
          {chart.labels.map((label, idx) => (
            <span key={idx}>{label}</span>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------ Bottom 3-Card Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Most Read Pages */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-xs sm:p-6">
          <span className="text-sm font-bold text-ink">Most read pages</span>
          <div className="flex flex-col gap-3">
            {mostReadPages.length > 0 ? (
              mostReadPages.map((item) => (
                <div key={item.path} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="max-w-[220px] truncate text-ink-body font-medium" title={item.path}>
                      {item.path}
                    </span>
                    <span className="font-mono text-ink-muted">
                      {item.views.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-tint-soft">
                    <div
                      className="h-1.5 rounded-full bg-blue transition-all duration-300"
                      style={{ width: `${item.pctOfMax}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-ink-muted">No page view data yet.</p>
            )}
          </div>
        </div>

        {/* Where They Came From */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-xs sm:p-6">
          <span className="text-sm font-bold text-ink">Where they came from</span>
          <div className="flex flex-col divide-y divide-border">
            {referrers.length > 0 ? (
              referrers.map((item) => (
                <div
                  key={item.host}
                  className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0"
                >
                  <span className="font-medium text-ink-body">{item.host}</span>
                  <span className="font-mono text-ink-muted">{item.percentage}%</span>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-ink-muted">No referrer data yet.</p>
            )}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-xs sm:p-6">
          <span className="text-sm font-bold text-ink">Device</span>
          <div className="flex flex-col gap-3.5">
            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink-body">Phone</span>
                <span className="font-mono font-bold text-ink">{devices.phonePct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-tint-soft">
                <div
                  className="h-2 rounded-full bg-blue transition-all duration-300"
                  style={{ width: `${devices.phonePct}%` }}
                />
              </div>
            </div>

            {/* Computer */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink-body">Computer</span>
                <span className="font-mono text-ink-muted">{devices.computerPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-tint-soft">
                <div
                  className="h-2 rounded-full bg-[#B9C6F5] transition-all duration-300"
                  style={{ width: `${devices.computerPct}%` }}
                />
              </div>
            </div>

            {/* Tablet */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-ink-body">Tablet</span>
                <span className="font-mono text-ink-muted">{devices.tabletPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-tint-soft">
                <div
                  className="h-2 rounded-full bg-[#DDE3FA] transition-all duration-300"
                  style={{ width: `${devices.tabletPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bottom advisory callout matching design */}
          <div className="mt-auto rounded-lg bg-[#EDF0FE] p-3 text-xs leading-relaxed text-[#24356F]">
            {devices.takeaway}
          </div>
        </div>
      </div>
    </div>
  );
}
