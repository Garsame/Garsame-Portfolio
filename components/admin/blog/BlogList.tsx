"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui";
import { StateBadge } from "@/components/admin/StateBadge";
import type { AdminPostRow, PostCounts } from "@/lib/admin/blog";
import { POST_CATEGORY_LABELS } from "@/lib/blog-rules";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Africa/Mogadishu",
});

export function BlogList({
  initialPosts,
  counts,
}: {
  initialPosts: AdminPostRow[];
  counts: PostCounts;
}) {
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "scheduled" | "archived">("all");
  const [search, setSearch] = useState("");

  const filtered = initialPosts.filter((p) => {
    if (filter === "published" && p.state !== "published") return false;
    if (filter === "draft" && (p.state !== "draft" || Boolean(p.scheduledFor))) return false;
    if (filter === "scheduled" && (p.state !== "draft" || !p.scheduledFor)) return false;
    if (filter === "archived" && p.state !== "archived") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Controls row */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: `All · ${counts.total}` },
            { key: "published", label: `Published · ${counts.published}` },
            { key: "draft", label: `Draft · ${counts.draft}` },
            { key: "scheduled", label: `Scheduled · ${counts.scheduled}` },
            { key: "archived", label: `Archived · ${counts.archived}` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`rounded-full px-4 py-2 text-caption font-semibold transition-button ${
                filter === tab.key
                  ? "bg-blue text-white"
                  : "border border-border bg-white text-ink-3 hover:border-border-strong hover:bg-tint-soft"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-[280px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts"
            aria-label="Search posts"
            className="w-full rounded-input border border-border bg-white py-2.5 pr-4 pl-9 text-small text-ink placeholder:text-muted focus:border-blue focus:outline-none"
          />
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute top-3 left-3 text-muted"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-hidden rounded-card border border-border bg-white shadow-card">
        {/* Table Header */}
        <div className="hidden grid-cols-[64px_2.6fr_1fr_1fr_1fr_0.7fr_80px] items-center gap-4 border-b border-border bg-field px-5 py-3.5 font-mono text-[10px] tracking-[0.1em] text-muted md:grid">
          <span></span>
          <span>TITLE</span>
          <span>CATEGORY</span>
          <span>STATUS</span>
          <span>DATE</span>
          <span>VIEWS</span>
          <span></span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-small text-muted">
            No posts found matching the filter.
          </div>
        ) : (
          filtered.map((post) => (
            <div
              key={post.id}
              className="grid grid-cols-1 items-center gap-3 border-b border-border-faint p-4 text-small transition-colors last:border-b-0 hover:bg-field md:grid-cols-[64px_2.6fr_1fr_1fr_1fr_0.7fr_80px] md:gap-4 md:px-5 md:py-3.25"
            >
              {/* Thumbnail */}
              <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-[6px] bg-accent-soft">
                {post.cover ? (
                  <Image
                    src={post.cover.url}
                    alt={post.cover.alt || post.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center font-mono text-[9px] text-muted">
                    NO ART
                  </div>
                )}
              </div>

              {/* Title + Featured */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="font-semibold text-ink hover:text-blue"
                >
                  {post.title}
                </Link>
                {post.featured && (
                  <Badge tone="accent">
                    Featured
                  </Badge>
                )}
              </div>

              {/* Category */}
              <span className="font-mono text-mono-meta text-ink-3">
                {POST_CATEGORY_LABELS[post.category]}
              </span>

              {/* Status */}
              <div className="justify-self-start">
                <StateBadge
                  state={post.state}
                  scheduled={Boolean(post.scheduledFor)}
                />
              </div>

              {/* Date */}
              <span className="font-mono text-mono-meta text-ink-body">
                {post.scheduledFor ? (
                  <span className="text-warning">
                    {dateFormat.format(new Date(post.scheduledFor))}
                  </span>
                ) : post.publishedAt ? (
                  dateFormat.format(new Date(post.publishedAt))
                ) : (
                  "Draft"
                )}
              </span>

              {/* Views */}
              <span className="font-mono text-mono-meta text-ink-body">
                {post.views.toLocaleString()}
              </span>

              {/* Action */}
              <div className="md:justify-self-end">
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="font-mono text-mono-meta font-semibold text-blue hover:underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}

        {/* Footer */}
        <div className="border-t border-border-faint px-5 py-3.5 font-mono text-[11px] text-muted">
          Showing {filtered.length} of {initialPosts.length} posts
        </div>
      </div>
    </div>
  );
}
