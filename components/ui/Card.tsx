import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The card: plain rounded 14px, a 1px border and the one soft shadow.
 *
 * No clipped corner. docs/02-DESIGN-SYSTEM.md is explicit that the cut belongs
 * to buttons and the v3 badge only — "this restraint is the point".
 *
 * Hover, when interactive: the border darkens to --color-border-strong and the
 * card lifts 2px over 200ms. A cover image inside scales to 1.02 in the same
 * movement; wrap it in CardCover to get that.
 */
export function Card({
  children,
  className,
  href,
  interactive,
  tone = "white",
}: {
  children: React.ReactNode;
  className?: string;
  /** Makes the whole card a link, and turns hover on. */
  href?: string;
  /** Hover without being a link — for cards whose action is a button inside. */
  interactive?: boolean;
  tone?: "white" | "tint-soft" | "accent-soft" | "ink";
}) {
  const hoverable = Boolean(href) || interactive;

  const toneClass =
    tone === "ink"
      ? "bg-ink"
      : tone === "accent-soft"
        ? "border border-blue bg-accent-soft"
        : tone === "tint-soft"
          ? "border border-border bg-tint-soft"
          : "border border-border bg-white";

  const classes = cn(
    "group relative flex flex-col rounded-card",
    toneClass,
    tone !== "ink" && "shadow-card",
    hoverable &&
      "transition-card hover:-translate-y-card-lift focus-visible:-translate-y-card-lift",
    hoverable && tone !== "ink" && "hover:border-border-strong",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <div className={classes}>{children}</div>;
}

/**
 * The cover-image area at the top of a card — design/01-home.html.
 *
 * Only `children` scales on hover. Anything in `overlay` — the `/ 001` index
 * tag, a status chip — is a sibling of the scaling layer, so it stays put
 * while the image moves behind it. The motion spec scales the cover image,
 * not the label sitting on top of it.
 */
export function CardCover({
  children,
  overlay,
  height = "project",
  className,
}: {
  children: React.ReactNode;
  overlay?: React.ReactNode;
  /** 182px on project cards, 158px on post cards. A prop rather than a
      className, because `cn` cannot override the height set here — D-022. */
  height?: "project" | "post";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-t-card bg-accent-soft",
        height === "post" ? "h-cover-post" : "h-cover",
        className,
      )}
    >
      <div className="flex h-full w-full items-center justify-center transition-cover group-hover:scale-102">
        {children}
      </div>
      {overlay}
    </div>
  );
}
