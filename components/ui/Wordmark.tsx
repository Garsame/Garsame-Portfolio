import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * GARSAME + the v3 chip.
 *
 * docs/01-PROJECT-BRIEF.md: no logo is designed yet, so the wordmark in Plus
 * Jakarta Sans 800 with a v3 chip beside it *is* the mark. Branding & Look
 * (Phase 9) can upload a logo, and this is the fallback when none is set.
 *
 * The chip is the only place besides buttons where the clipped corner appears.
 * Three sizes, measured from design/01-home.html (header and footer) and
 * design/21-admin-dashboard.html (sidebar).
 */

type Size = "md" | "sm" | "admin";

const markSize: Record<Size, string> = {
  md: "text-wordmark",
  sm: "text-wordmark-sm",
  admin: "text-wordmark-admin",
};

const chipSize: Record<Size, string> = {
  md: "text-chip px-chip-x py-chip-y clip-corner-badge",
  sm: "text-chip-sm px-chip-sm-x py-chip-sm-y clip-corner-badge-sm",
  admin: "text-chip-sm px-chip-admin-x py-chip-sm-y clip-corner-badge-sm",
};

export function Wordmark({
  size = "md",
  href = "/",
  tone = "ink",
  className,
}: {
  size?: Size;
  /** Pass null to render as plain text rather than a link. */
  href?: string | null;
  tone?: "ink" | "white";
  className?: string;
}) {
  const inner = (
    <>
      <span className={cn(markSize[size], tone === "white" && "text-white")}>
        GARSAME
      </span>
      <span
        className={cn("bg-blue font-mono text-white", chipSize[size])}
        aria-hidden="true"
      >
        v3
      </span>
    </>
  );

  /* min-h-11 gives the link the 44px tap target docs/02-DESIGN-SYSTEM.md asks
     for; the mark itself is only 36px tall. It does not change the layout —
     the header around it is 76px. */
  const classes = cn(
    "inline-flex items-center gap-wordmark-gap",
    href !== null && "min-h-11",
    className,
  );

  if (href === null) {
    return <span className={classes}>{inner}</span>;
  }

  /* The chip is aria-hidden, so the accessible name is spelled out here —
     otherwise a screen reader announces only "GARSAME". */
  return (
    <Link
      href={href}
      className={classes}
      aria-label={href === "/" ? "GARSAME v3, home" : "GARSAME v3"}
    >
      {inner}
    </Link>
  );
}
