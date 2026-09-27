import { cn } from "@/lib/utils";

/**
 * The section opener: a mono eyebrow, then a heading whose final phrase sits
 * in the accent colour, then an optional sub-paragraph.
 *
 * docs/02-DESIGN-SYSTEM.md calls this pattern mandatory and says it is what
 * gives the long home page its rhythm, so the parts are not optional-by-
 * accident: the `//` prefix is added here rather than typed by each caller,
 * and `accent` is a separate prop so the final phrase cannot be forgotten.
 *
 * Section headings are visually H1-sized (40px) but usually semantically h2,
 * since the page already has an h1. Pass `as` to set the tag; the size comes
 * from the token either way.
 */

type Tone = "light" | "ink" | "blue";

const eyebrowTone: Record<Tone, string> = {
  light: "text-blue",
  ink: "text-blue-light",
  blue: "text-on-blue-muted",
};

const headingTone: Record<Tone, string> = {
  light: "text-ink",
  ink: "text-white",
  blue: "text-white",
};

const accentTone: Record<Tone, string> = {
  light: "text-blue",
  ink: "text-blue-light",
  blue: "text-on-blue-muted",
};

const subTone: Record<Tone, string> = {
  light: "text-ink-body",
  ink: "text-on-ink-body",
  blue: "text-on-blue-body",
};

export function SectionHeading({
  eyebrow,
  heading,
  accent,
  sub,
  align = "left",
  tone = "light",
  as: Tag = "h2",
  mutedEyebrow = false,
  className,
  subMaxWidth = "max-w-sub",
  id,
}: {
  /** Without the `//` — it is added here. */
  eyebrow: string;
  heading: string;
  /** The final phrase, rendered in the accent colour. */
  accent?: string;
  sub?: string;
  align?: "left" | "center";
  tone?: Tone;
  as?: "h1" | "h2" | "h3";
  /** Section 08 "Working with" uses a muted eyebrow rather than blue. */
  mutedEyebrow?: boolean;
  className?: string;
  subMaxWidth?: string;
  /** Put on the heading, for a section's aria-labelledby. */
  id?: string;
}) {
  const centred = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col",
        centred
          ? "items-center gap-heading-gap text-center"
          : "gap-heading-gap-left",
        className,
      )}
    >
      <span
        className={cn(
          "font-mono text-mono-label uppercase",
          mutedEyebrow ? "text-muted" : eyebrowTone[tone],
        )}
      >
        {/* The slashes are decoration; a screen reader would read them out
            as "slash slash". */}
        <span aria-hidden="true">{"// "}</span>
        {eyebrow}
      </span>

      <Tag id={id} className={cn("text-h1-sm lg:text-h1", headingTone[tone])}>
        {heading}
        {accent ? (
          <>
            {" "}
            <span className={accentTone[tone]}>{accent}</span>
          </>
        ) : null}
      </Tag>

      {sub ? (
        <p className={cn("text-body", subTone[tone], subMaxWidth)}>{sub}</p>
      ) : null}
    </div>
  );
}
