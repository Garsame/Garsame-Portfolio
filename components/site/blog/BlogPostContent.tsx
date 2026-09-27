"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Container } from "@/components/ui";
import { EditorContent } from "@/components/site/EditorContent";
import { CoverImage } from "@/components/site/CoverImage";
import { Section } from "@/components/site/Section";
import { ReadingProgress } from "@/components/site/blog/ReadingProgress";
import { PostTOC } from "@/components/site/blog/PostTOC";
import { POST_CATEGORY_LABELS } from "@/lib/blog-rules";
import type { BlogPostDetailView, BlogPostSummaryView } from "@/lib/blog";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Mogadishu",
});

export function BlogPostContent({
  post,
  relatedPosts = [],
  isPreview = false,
}: {
  post: BlogPostDetailView;
  relatedPosts?: BlogPostSummaryView[];
  isPreview?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = post.publishedAt
    ? dateFormat.format(new Date(post.publishedAt))
    : "Draft";

  return (
    <article className="min-h-screen bg-white">
      {!isPreview && <ReadingProgress />}

      {/* -------------------------------------------------------- Title Block */}
      <section className="bg-tint-soft px-6 py-14 sm:px-12 md:py-16">
        <Container className="mx-auto flex max-w-[840px] flex-col items-center gap-4.5 text-center">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-mono-meta font-semibold text-blue">
              # {String(post.number).padStart(3, "0")}
            </span>
            <span className="rounded-[5px] bg-accent-soft px-2.5 py-1 font-mono text-mono-chip uppercase text-blue">
              {POST_CATEGORY_LABELS[post.category] || post.category}
            </span>
          </div>

          <h1 className="text-display font-extrabold tracking-tight text-ink lg:text-[44px] lg:leading-[1.18]">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-mono-meta text-muted">
            <span>Garsame Mohamud</span>
            <span aria-hidden="true">·</span>
            <span>{formattedDate}</span>
            <span aria-hidden="true">·</span>
            <span>{post.readingTime} min read</span>
          </div>
        </Container>
      </section>

      {/* -------------------------------------------------------- Cover Image */}
      <div className="relative flex h-[300px] w-full items-center justify-center overflow-hidden bg-accent-wash sm:h-[400px]">
        {post.cover ? (
          <CoverImage image={post.cover} sizes="100vw" eager />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-strong">
            <svg
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <circle cx="8" cy="10" r="2" />
              <path d="M2 17l6-5 5 4 3-3 6 5" />
            </svg>
            <span className="font-mono text-mono-meta text-muted">
              [ COVER IMAGE ]
            </span>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- Article Layout */}
      <div className="bg-white py-14 lg:py-18">
        <Container innerClassName="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr_260px] lg:gap-14 items-start">
          {/* Left: Sticky TOC */}
          <aside className="hidden lg:sticky lg:top-24 lg:block">
            <PostTOC toc={post.toc} />
          </aside>

          {/* Center: Article Body */}
          <main className="mx-auto w-full max-w-[680px]">
            {post.excerpt && (
              <p className="mb-6 text-h4 font-medium leading-[1.75] text-prose">
                {post.excerpt}
              </p>
            )}

            {post.body ? (
              <EditorContent doc={post.body} />
            ) : (
              <div className="py-8 font-mono text-small text-muted">
                [ No content written yet ]
              </div>
            )}
          </main>

          {/* Right: Sticky Share */}
          <aside className="flex flex-col gap-3.5 lg:sticky lg:top-24">
            <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
              SHARE
            </span>
            <div className="flex gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  post.title,
                )}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X / Twitter"
                className="flex size-9 items-center justify-center rounded-input border border-border bg-tint text-ink-3 transition-colors hover:border-blue hover:text-blue"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  shareUrl,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on LinkedIn"
                className="flex size-9 items-center justify-center rounded-input border border-border bg-tint text-ink-3 transition-colors hover:border-blue hover:text-blue"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
              <button
                type="button"
                onClick={copyLink}
                aria-label="Copy link to clipboard"
                className="relative flex size-9 items-center justify-center rounded-input border border-border bg-tint text-ink-3 transition-colors hover:border-blue hover:text-blue"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                  <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                </svg>
                {copied && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-ink px-1.5 py-0.5 font-mono text-[9px] text-white">
                    Copied
                  </span>
                )}
              </button>
            </div>
          </aside>
        </Container>
      </div>

      {/* ------------------------------------------- Author + Membership CTA */}
      <Section tone="tint" pad="band">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Author card */}
          <div className="flex items-start gap-4.5 rounded-card border border-border bg-white p-7 shadow-card">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-border-strong font-mono text-mono-label font-bold text-ink">
              GM
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="text-body font-bold text-ink">
                Garsame Mohamud
              </span>
              <p className="text-small leading-[1.65] text-ink-body">
                I build the systems Somali businesses run on. Six years of field
                work before the first line of code.
              </p>
            </div>
          </div>

          {/* Membership card */}
          <div className="flex flex-col gap-3 rounded-card bg-ink p-7 text-white shadow-card">
            <span className="font-mono text-[10px] tracking-[0.12em] text-blue-light uppercase">
              {"// MEMBERSHIP"}
            </span>
            <span className="text-[19px] font-bold text-white">
              Get the next one first
            </span>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <input
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                className="w-full flex-1 rounded-input bg-white px-3.5 py-2.5 text-small text-ink placeholder:text-muted focus:outline-none"
              />
              <Button href="/membership" size="sm">
                Join
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------- Related Posts */}
      {relatedPosts.length > 0 && (
        <Section tone="white">
          <div className="flex flex-col gap-6">
            <span className="font-mono text-mono-label tracking-widest text-blue uppercase">
              {"// Read next"}
            </span>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {relatedPosts.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group grid grid-cols-1 items-center overflow-hidden rounded-card border border-border bg-white transition-all hover:border-border-strong hover:shadow-card sm:grid-cols-[160px_1fr]"
                >
                  <div className="relative h-32 w-full bg-accent-soft sm:h-full">
                    {r.cover ? (
                      <CoverImage image={r.cover} sizes="160px" />
                    ) : (
                      <div className="flex size-full items-center justify-center font-mono text-[10px] text-muted">
                        # {String(r.number).padStart(3, "0")}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 p-5">
                    <span className="font-mono text-[10px] tracking-[0.1em] text-blue uppercase">
                      {POST_CATEGORY_LABELS[r.category]}
                    </span>
                    <h3 className="text-body font-bold text-ink group-hover:text-blue">
                      {r.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}
    </article>
  );
}
