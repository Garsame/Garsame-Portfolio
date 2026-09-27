import { cn } from "@/lib/utils";
import { NavButton } from "./AdminShell";

/**
 * The admin top bar — design/21-admin-dashboard.html: 68px, the page title
 * with a mono subtitle under it, and the page's actions on the right.
 */
export function TopBar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-topbar shrink-0 items-center justify-between gap-4 border-b border-border bg-white px-4 lg:px-7">
      <div className="flex min-w-0 items-center gap-2">
        <NavButton />
        <div className="flex min-w-0 flex-col gap-px">
          <h1 className="truncate text-h4 text-ink">{title}</h1>
          {subtitle ? (
            <span className="truncate font-mono text-mono-meta font-regular tracking-none text-muted">
              {subtitle}
            </span>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2.5">{actions}</div>
      ) : null}
    </header>
  );
}

/** The page body under the top bar. */
export function AdminContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 px-4 py-5 lg:px-7 lg:py-6">
      {children}
    </div>
  );
}

/** A white panel — plain rounded, per the design system. */
export function Panel({
  title,
  meta,
  children,
  className,
}: {
  title?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4.5 rounded-card border border-border bg-white p-5.5",
        className,
      )}
    >
      {title ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-body font-bold text-ink">{title}</h2>
          {meta ? (
            <span className="font-mono text-mono-meta font-regular tracking-none text-muted">
              {meta}
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
