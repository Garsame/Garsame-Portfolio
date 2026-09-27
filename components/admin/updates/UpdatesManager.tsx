"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { AdminBroadcastListItem } from "@/lib/admin/updates";
import {
  cancelScheduleAction,
  deleteBroadcastAction,
} from "@/app/admin/(editor)/updates/actions";
import { cn } from "@/lib/utils";

export function UpdatesManager({
  initialBroadcasts,
  counts,
}: {
  initialBroadcasts: AdminBroadcastListItem[];
  counts: {
    all: number;
    drafts: number;
    scheduled: number;
    sent: number;
    failed: number;
  };
}) {
  const router = useRouter();
  const [broadcasts, setBroadcasts] =
    useState<AdminBroadcastListItem[]>(initialBroadcasts);
  const [tab, setTab] = useState<
    "all" | "draft" | "scheduled" | "sent" | "failed"
  >("all");

  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this broadcast record?")
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteBroadcastAction(id);
      if (res.ok) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
        router.refresh();
      }
    });
  };

  const handleCancelSchedule = (id: string) => {
    startTransition(async () => {
      const res = await cancelScheduleAction(id);
      if (res.ok) {
        setBroadcasts((prev) =>
          prev.map((b) => (b.id === id ? { ...b, state: "draft", scheduledFor: null } : b)),
        );
        router.refresh();
      }
    });
  };

  const filtered =
    tab === "all" ? broadcasts : broadcasts.filter((b) => b.state === tab);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Controls & Status Tabs */}
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
            All · {counts.all}
          </button>
          <button
            type="button"
            onClick={() => setTab("draft")}
            className={cn(
              "rounded-full px-4 py-2 text-small font-semibold transition-button",
              tab === "draft"
                ? "bg-ink text-white shadow-xs"
                : "border border-border bg-white text-ink-body hover:bg-tint",
            )}
          >
            Drafts · {counts.drafts}
          </button>
          <button
            type="button"
            onClick={() => setTab("scheduled")}
            className={cn(
              "rounded-full px-4 py-2 text-small font-semibold transition-button",
              tab === "scheduled"
                ? "bg-[#B4690E] text-white shadow-xs"
                : "border border-border bg-white text-ink-body hover:bg-tint",
            )}
          >
            Scheduled · {counts.scheduled}
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
            Sent · {counts.sent}
          </button>
          {counts.failed > 0 && (
            <button
              type="button"
              onClick={() => setTab("failed")}
              className={cn(
                "rounded-full px-4 py-2 text-small font-semibold transition-button",
                tab === "failed"
                  ? "bg-[#C0342B] text-white shadow-xs"
                  : "border border-[#F0C9C6] bg-[#FBEAE9] text-[#C0342B] hover:bg-[#F8D7D5]",
              )}
            >
              Failed · {counts.failed}
            </button>
          )}
        </div>

        <Button href="/admin/updates/new" size="sm">
          New update
        </Button>
      </div>

      {/* Broadcasts List */}
      <div className="flex flex-col gap-3">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-card border border-border bg-white p-6 shadow-card md:flex-row md:items-center md:justify-between"
            >
              <div className="flex flex-col gap-1.5 min-w-0 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href={
                      item.state === "draft" || item.state === "scheduled"
                        ? `/admin/updates/${item.id}`
                        : `/admin/updates/${item.id}/logs`
                    }
                    className="text-body-lg font-bold text-ink hover:text-blue transition-button truncate"
                  >
                    {item.subject}
                  </Link>

                  {item.state === "draft" && (
                    <span className="font-mono text-mono-chip text-ink-body bg-tint px-2 py-0.5 rounded-sm uppercase">
                      Draft
                    </span>
                  )}
                  {item.state === "scheduled" && (
                    <span className="font-mono text-mono-chip font-bold text-[#B4690E] bg-[#FBF1E3] px-2 py-0.5 rounded-sm uppercase">
                      Scheduled
                    </span>
                  )}
                  {item.state === "sending" && (
                    <span className="font-mono text-mono-chip font-bold text-blue bg-[#EDF0FE] px-2 py-0.5 rounded-sm uppercase animate-pulse">
                      Sending...
                    </span>
                  )}
                  {item.state === "sent" && (
                    <span className="font-mono text-mono-chip font-bold text-[#1A7F4B] bg-[#E6F5ED] px-2 py-0.5 rounded-sm uppercase">
                      Sent
                    </span>
                  )}
                  {item.state === "failed" && (
                    <span className="font-mono text-mono-chip font-bold text-[#C0342B] bg-[#FBEAE9] px-2 py-0.5 rounded-sm uppercase">
                      Failed
                    </span>
                  )}
                </div>

                {item.previewText && (
                  <p className="text-small text-ink-body line-clamp-1">
                    {item.previewText}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[12px] text-muted">
                  {item.sentAt ? (
                    <span>
                      Sent{" "}
                      {new Date(item.sentAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : item.scheduledFor ? (
                    <span className="text-[#B4690E]">
                      Scheduled for{" "}
                      {new Date(item.scheduledFor).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : (
                    <span>
                      Created{" "}
                      {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}

                  {item.state === "sent" || item.state === "failed" ? (
                    <>
                      <span>·</span>
                      <span className="text-[#1A7F4B] font-semibold">
                        {item.deliveredCount} delivered
                      </span>
                      {item.failedCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-[#C0342B] font-semibold">
                            {item.failedCount} failed
                          </span>
                        </>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                {item.state === "draft" && (
                  <>
                    <Button
                      href={`/admin/updates/${item.id}`}
                      variant="secondary"
                      size="xs"
                    >
                      Edit draft
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="xs"
                      onClick={() => handleDelete(item.id)}
                      disabled={isPending}
                    >
                      Delete
                    </Button>
                  </>
                )}

                {item.state === "scheduled" && (
                  <>
                    <Button
                      href={`/admin/updates/${item.id}`}
                      variant="secondary"
                      size="xs"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      onClick={() => handleCancelSchedule(item.id)}
                      disabled={isPending}
                    >
                      Cancel schedule
                    </Button>
                  </>
                )}

                {(item.state === "sent" || item.state === "failed") && (
                  <>
                    <Button
                      href={`/admin/updates/${item.id}/logs`}
                      variant="secondary"
                      size="xs"
                    >
                      View mail log
                    </Button>
                    {item.failedCount > 0 && (
                      <Button
                        href={`/admin/updates/${item.id}/logs`}
                        variant="danger"
                        size="xs"
                      >
                        Retry {item.failedCount} failed
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-card border border-border bg-white p-12 text-center">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7D89AE"
              strokeWidth="1.5"
              className="mb-3"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
            <h3 className="text-body-lg font-bold text-ink">
              No updates in this view
            </h3>
            <p className="mt-1 max-w-sm text-small text-ink-body">
              Broadcasts keep members informed about newly delivered systems and practical lessons.
            </p>
            <div className="mt-4">
              <Button href="/admin/updates/new" size="sm">
                Create first update
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
