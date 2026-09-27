"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import type { BroadcastMailLogsData } from "@/lib/admin/mail-logs";
import {
  retryAllFailedLogsAction,
  retrySingleLogAction,
} from "@/app/admin/(editor)/updates/actions";
import { cn } from "@/lib/utils";

export function MailLogsView({
  initialData,
}: {
  initialData: BroadcastMailLogsData;
}) {
  const [data, setData] = useState<BroadcastMailLogsData>(initialData);
  const [tab, setTab] = useState<"all" | "sent" | "failed" | "queued">("all");
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { broadcast, logs, stats } = data;

  const handleRetrySingle = (logId: string) => {
    setRetryingLogId(logId);
    startTransition(async () => {
      const res = await retrySingleLogAction(logId);
      setRetryingLogId(null);
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          logs: prev.logs.map((l) =>
            l.id === logId
              ? {
                  ...l,
                  status: "sent",
                  error: null,
                  attempts: l.attempts + 1,
                  time: new Date().toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZone: "Africa/Mogadishu",
                  }),
                }
              : l,
          ),
          stats: {
            ...prev.stats,
            delivered: prev.stats.delivered + 1,
            failed: Math.max(0, prev.stats.failed - 1),
          },
        }));
      } else {
        alert(res.message || "Retry attempt failed.");
      }
    });
  };

  const handleRetryAllFailed = () => {
    if (stats.failed === 0) return;
    startTransition(async () => {
      const res = await retryAllFailedLogsAction(broadcast.id);
      if (res.ok) {
        window.location.reload();
      }
    });
  };

  const filteredLogs =
    tab === "all" ? logs : logs.filter((l) => l.status === tab);

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards Grid (4 columns) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5 rounded-card border border-border bg-white p-5 shadow-card">
          <span className="font-mono text-mono-chip tracking-wider text-muted uppercase">
            RECIPIENTS
          </span>
          <span className="text-[28px] font-extrabold tracking-tight text-ink">
            {stats.recipients}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 rounded-card border border-border bg-white p-5 shadow-card">
          <span className="font-mono text-mono-chip tracking-wider text-muted uppercase">
            DELIVERED
          </span>
          <span className="text-[28px] font-extrabold tracking-tight text-[#1A7F4B]">
            {stats.delivered}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 rounded-card border border-border bg-white p-5 shadow-card">
          <span className="font-mono text-mono-chip tracking-wider text-muted uppercase">
            FAILED
          </span>
          <span
            className={cn(
              "text-[28px] font-extrabold tracking-tight",
              stats.failed > 0 ? "text-[#C0342B]" : "text-ink",
            )}
          >
            {stats.failed}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 rounded-card border border-border bg-white p-5 shadow-card">
          <span className="font-mono text-mono-chip tracking-wider text-muted uppercase">
            STATUS
          </span>
          <span className="text-[20px] font-bold text-ink uppercase mt-1.5">
            {broadcast.state}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={cn(
              "rounded-full px-4 py-2 text-small font-semibold transition-button",
              tab === "all"
                ? "bg-blue text-white shadow-xs"
                : "border border-border bg-white text-ink-body hover:bg-tint",
            )}
          >
            All · {stats.recipients}
          </button>
          <button
            type="button"
            onClick={() => setTab("sent")}
            className={cn(
              "rounded-full px-4 py-2 text-small font-semibold transition-button",
              tab === "sent"
                ? "bg-[#1A7F4B] text-white shadow-xs"
                : "border border-border bg-white text-ink-body hover:bg-tint",
            )}
          >
            Sent · {stats.delivered}
          </button>
          <button
            type="button"
            onClick={() => setTab("failed")}
            className={cn(
              "rounded-full px-4 py-2 text-small font-semibold transition-button",
              tab === "failed"
                ? "bg-[#C0342B] text-white shadow-xs"
                : stats.failed > 0
                  ? "border border-[#F0C9C6] bg-[#FBEAE9] text-[#C0342B] hover:bg-[#F8D7D5]"
                  : "border border-border bg-white text-ink-body hover:bg-tint",
            )}
          >
            Failed · {stats.failed}
          </button>
          {stats.queued > 0 && (
            <button
              type="button"
              onClick={() => setTab("queued")}
              className={cn(
                "rounded-full px-4 py-2 text-small font-semibold transition-button",
                tab === "queued"
                  ? "bg-ink text-white shadow-xs"
                  : "border border-border bg-white text-ink-body hover:bg-tint",
              )}
            >
              Queued · {stats.queued}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/api/admin/updates/${broadcast.id}/logs/export`}
            download={`mail-log-${broadcast.id}.csv`}
            className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-white px-4 py-2 text-small font-semibold text-ink hover:bg-tint transition-button shadow-xs"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export log
          </a>

          {stats.failed > 0 && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleRetryAllFailed}
              disabled={isPending}
            >
              Retry {stats.failed} failed
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex flex-col rounded-card border border-border bg-white shadow-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1.8fr_1fr_1fr_2fr_90px] gap-4 border-b border-border bg-[#F8FAFF] px-6 py-3.5 font-mono text-[11px] tracking-wider text-muted uppercase">
          <span>RECIPIENT</span>
          <span>STATUS</span>
          <span>TIME</span>
          <span>ERROR</span>
          <span className="text-right">ACTION</span>
        </div>

        {/* Rows */}
        <div className="flex flex-col divide-y divide-border/60">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const isFailed = log.status === "failed";
              const isSent = log.status === "sent";

              return (
                <div
                  key={log.id}
                  className={cn(
                    "grid grid-cols-[1.8fr_1fr_1fr_2fr_90px] gap-4 items-center px-6 py-4 text-small transition-colors",
                    isFailed ? "bg-[#FFF9F9]" : "hover:bg-tint-soft/50",
                  )}
                >
                  {/* Recipient */}
                  <span className="font-medium text-ink truncate" title={log.to}>
                    {log.to}
                  </span>

                  {/* Status Badge */}
                  <div>
                    {isSent && (
                      <span className="font-mono text-[11px] font-bold text-[#1A7F4B] bg-[#E6F5ED] px-2.5 py-1 rounded-sm uppercase tracking-wide">
                        Sent
                      </span>
                    )}
                    {isFailed && (
                      <span className="font-mono text-[11px] font-bold text-[#C0342B] bg-[#FBEAE9] px-2.5 py-1 rounded-sm uppercase tracking-wide">
                        Failed
                      </span>
                    )}
                    {log.status === "queued" && (
                      <span className="font-mono text-[11px] font-bold text-blue bg-[#EDF0FE] px-2.5 py-1 rounded-sm uppercase tracking-wide">
                        Queued
                      </span>
                    )}
                  </div>

                  {/* Time */}
                  <span className="font-mono text-[12px] text-muted">
                    {log.time || "—"}
                  </span>

                  {/* Error Message */}
                  <span
                    className={cn(
                      "font-mono text-[12px] truncate",
                      isFailed ? "text-[#C0342B]" : "text-border",
                    )}
                    title={log.error || undefined}
                  >
                    {log.error || "—"}
                  </span>

                  {/* Retry Action */}
                  <div className="text-right font-mono text-[12px]">
                    {isFailed ? (
                      <button
                        type="button"
                        onClick={() => handleRetrySingle(log.id)}
                        disabled={retryingLogId === log.id || isPending}
                        className="font-semibold text-blue hover:underline disabled:opacity-50"
                      >
                        {retryingLogId === log.id ? "Retrying..." : "Retry"}
                      </button>
                    ) : (
                      <span className="text-border">—</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <span className="font-mono text-small text-muted">
                No logs in this filter tab.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-[#F8FAFF] px-6 py-3.5 font-mono text-mono-meta text-muted">
          <span>
            Showing {filteredLogs.length} of {stats.recipients}
          </span>
          <span>Every send is recorded. Nothing is ever sent silently.</span>
        </div>
      </div>
    </div>
  );
}
