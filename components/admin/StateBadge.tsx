import { cn } from "@/lib/utils";
import type { ContentState } from "@/lib/project-form";

/**
 * Draft · Published · Archived · Scheduled — design/25-admin-blog-list.html & design/27-admin-projects-list.html.
 */
const TONE: Record<ContentState, string> = {
  draft: "bg-neutral-bg text-muted-strong",
  published: "bg-success-bg text-success",
  archived: "bg-warning-bg text-warning",
};

const LABEL: Record<ContentState, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export function StateBadge({
  state,
  scheduled = false,
  className,
}: {
  state: ContentState;
  scheduled?: boolean;
  className?: string;
}) {
  if (scheduled && state === "draft") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-chip bg-warning-bg px-status-x py-status-y font-mono text-mono-chip uppercase text-warning",
          className,
        )}
      >
        Scheduled
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-chip px-status-x py-status-y font-mono text-mono-chip uppercase",
        TONE[state],
        className,
      )}
    >
      {LABEL[state]}
    </span>
  );
}
