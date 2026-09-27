"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui";
import { BlogPostContent } from "@/components/site/blog/BlogPostContent";
import type { BlogPostDetailView } from "@/lib/blog";

export function BlogPreviewOverlay({
  post,
  onClose,
}: {
  post: BlogPostDetailView;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Post page preview"
      className="fixed inset-0 z-50 overflow-y-auto bg-white outline-none"
    >
      <div className="sticky top-0 z-50 flex min-h-topbar-editor flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-4 py-2 lg:px-6">
        <div className="flex flex-col gap-px">
          <span className="text-caption font-bold text-ink">Page preview</span>
          <span className="font-mono text-mono-meta font-regular text-muted">
            Unsaved changes included · related posts and share stats appear on the live page
          </span>
        </div>
        <Button size="xs" variant="secondary" onClick={onClose}>
          Close preview
        </Button>
      </div>

      <BlogPostContent post={post} isPreview />
    </div>
  );
}
