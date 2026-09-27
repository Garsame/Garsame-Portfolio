"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui";
import { ProjectPage } from "@/components/site/projects/ProjectPage";
import type { ProjectDetailView } from "@/lib/project-view";

/**
 * Page preview — docs/04-ADMIN.md: "the exact public post rendered from the
 * current form, including unsaved changes".
 *
 * It is the public ProjectPage component itself, given the form as it stands.
 * What only the live page can know is left out and said so: the client quote
 * and the previous / next links depend on other published records.
 */
export function PreviewOverlay({
  project,
  index,
  onClose,
}: {
  project: ProjectDetailView;
  index: number;
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
      aria-label="Page preview"
      className="fixed inset-0 z-50 overflow-y-auto bg-white outline-none"
    >
      <div className="sticky top-0 z-10 flex min-h-topbar-editor flex-wrap items-center justify-between gap-3 border-b border-border bg-white px-4 py-2 lg:px-6">
        <div className="flex flex-col gap-px">
          <span className="text-caption font-bold text-ink">Page preview</span>
          <span className="font-mono text-mono-meta font-regular tracking-none text-muted">
            Unsaved changes included · the client quote and previous / next
            links appear on the live page
          </span>
        </div>
        <Button size="xs" variant="secondary" onClick={onClose}>
          Close preview
        </Button>
      </div>
      <div className="flex flex-col">
        <ProjectPage
          project={project}
          context={{ index, quote: null, previous: null, next: null }}
          preview
        />
      </div>
    </div>
  );
}
