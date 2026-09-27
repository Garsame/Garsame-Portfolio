import { Container } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * A page section: its background, its padding and its gutters.
 *
 * docs/02-DESIGN-SYSTEM.md sets the rhythm — "no two neighbouring sections
 * share a background" — and the order down the home page is:
 *
 *   gradient → blue → tint → white → tint → accent-wash → white → tint →
 *   white → tint → white → ink → white → tint footer
 *
 * Each section sets its own tone here, so the order of Sections on a page is
 * the rhythm.
 *
 * There is no numbered spine. It was removed at Garsame's request — no line
 * down the left and no section numbers, on any page. DECISIONS.md D-044.
 */

export type SectionTone =
  "white" | "tint" | "gradient" | "blue" | "ink" | "accent-wash";

const tones: Record<SectionTone, string> = {
  white: "bg-white",
  tint: "bg-tint",
  /* The hero. design/01-home.html: a gradient from --tint-soft to white. */
  gradient: "bg-linear-to-b from-tint-soft to-white",
  blue: "bg-blue",
  ink: "bg-ink",
  "accent-wash": "bg-accent-wash border-y border-border-strong",
};

/** The vertical padding a band uses, where it is not the 92px default. */
export type SectionPad =
  "default" | "hero" | "band" | "band-sm" | "ink-band" | "none";

const pads: Record<SectionPad, string> = {
  default: "py-section-sm lg:py-section",
  hero: "pt-section-sm pb-section-sm lg:pt-hero-top lg:pb-hero-bottom",
  band: "py-section-sm lg:py-band",
  "band-sm": "py-section-sm lg:py-band-sm",
  "ink-band": "py-section-sm lg:py-ink-band",
  none: "",
};

export function Section({
  children,
  tone = "white",
  pad = "default",
  id,
  className,
  innerClassName,
  as: Tag = "section",
  "aria-labelledby": labelledBy,
}: {
  children: React.ReactNode;
  tone?: SectionTone;
  pad?: SectionPad;
  id?: string;
  className?: string;
  innerClassName?: string;
  as?: "section" | "div" | "footer";
  "aria-labelledby"?: string;
}) {
  return (
    <Tag
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative", tones[tone], pads[pad], className)}
    >
      <Container innerClassName={innerClassName}>{children}</Container>
    </Tag>
  );
}
