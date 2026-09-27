import { cn } from "@/lib/utils";

/**
 * Small mono labels.
 *
 * `StatusChip` is the project state — the four values in docs/05-DATA-MODEL.md.
 * `Badge` is the generic label; `FilterPill` is the fully rounded chip on the
 * projects and blog filters.
 */

/* --------------------------------------------------------------- StatusChip */

export type ProjectStatus = "live" | "building" | "completed" | "concept";

/* live, building and concept are measured from design/04-projects.html and
   design/27-admin-projects-list.html.

   `completed` has no chip anywhere in design/ — see DECISIONS.md D-013. It
   takes the accent family, which reads as distinct from the green of "live"
   without inventing a new hue. */
const statusClass: Record<ProjectStatus, string> = {
  live: "bg-success-bg text-success",
  building: "bg-warning-bg text-warning",
  completed: "bg-accent-soft text-accent-ink",
  concept: "bg-neutral-bg text-ink-3",
};

/* On the ink project header — design/05-project-detail.html draws Building;
   the rest follow it from their own colours. D-073. */
const statusOnInkClass: Record<ProjectStatus, string> = {
  live: "bg-success-on-ink-bg text-success-on-ink",
  building: "bg-warning-on-ink-bg text-warning-on-ink",
  completed: "bg-accent-on-ink-bg text-accent-on-ink",
  concept: "bg-neutral-on-ink-bg text-neutral-on-ink",
};

const statusLabel: Record<ProjectStatus, string> = {
  live: "Live",
  building: "Building",
  completed: "Completed",
  concept: "Concept",
};

const chipBase =
  "inline-flex items-center rounded-chip px-status-x py-status-y font-mono text-mono-chip uppercase";

export function StatusChip({
  status,
  tone = "light",
  className,
}: {
  status: ProjectStatus;
  tone?: "light" | "ink";
  className?: string;
}) {
  return (
    <span
      className={cn(
        chipBase,
        tone === "ink" ? statusOnInkClass[status] : statusClass[status],
        className,
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

/* -------------------------------------------------------------------- Badge */

type BadgeTone =
  "accent" | "neutral" | "success" | "warning" | "danger" | "solid";

const badgeTone: Record<BadgeTone, string> = {
  accent: "bg-accent-soft text-accent-ink",
  neutral: "bg-neutral-bg text-ink-3",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  solid: "bg-blue text-white",
};

export function Badge({
  children,
  tone = "accent",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={cn(chipBase, badgeTone[tone], className)}>{children}</span>
  );
}

/* --------------------------------------------------------------- FilterPill */

/**
 * The filter chip on /projects and /blog. Fully rounded, unlike every other
 * chip — measured from design/04-projects.html.
 */
export function FilterPill({
  children,
  active = false,
  href,
  onClick,
  ariaPressed,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  /** For a pill that toggles a filter in place — announces its state. */
  ariaPressed?: boolean;
  className?: string;
}) {
  const classes = cn(
    "inline-flex items-center rounded-pill px-pill-x py-pill-y text-caption font-medium transition-button",
    active
      ? "bg-blue text-white"
      : "border border-border bg-white text-ink-3 hover:border-border-strong",
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      className={cn(classes, "min-h-11")}
    >
      {children}
    </button>
  );
}
