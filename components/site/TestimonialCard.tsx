import Image from "next/image";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { QuoteMark } from "./icons";

export type TestimonialCardData = {
  name: string;
  role?: string;
  business?: string;
  quote: string;
  photoUrl?: string | null;
};

/**
 * A published testimonial, and the ink "your turn" card that invites one —
 * design/01-home.html section 09.
 *
 * The email a testimonial is submitted with is never rendered anywhere:
 * docs/05-DATA-MODEL.md, "private, never rendered publicly". The type used
 * here does not carry it.
 */
export function TestimonialCard({
  testimonial,
}: {
  testimonial: TestimonialCardData;
}) {
  const byline = [testimonial.role, testimonial.business]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="h-full gap-3.75 px-6.5 py-7">
      <QuoteMark className="text-blue-wash" />

      <blockquote className="text-body text-ink-2">
        {testimonial.quote}
      </blockquote>

      <div className="mt-auto flex items-center gap-3 pt-1">
        {testimonial.photoUrl ? (
          <div className="relative size-author shrink-0 overflow-hidden rounded-full border border-border">
            <Image
              src={testimonial.photoUrl}
              alt={testimonial.name}
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
        ) : (
          <span
            aria-hidden="true"
            className="size-author shrink-0 rounded-full bg-avatar-1"
          />
        )}
        <div className="flex flex-col gap-0.5">
          <span className="text-body font-bold text-ink">
            {testimonial.name}
          </span>
          {byline ? (
            <span className="font-mono text-mono-meta font-regular tracking-none text-muted">
              {byline}
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

/**
 * The ink card. One of the two uses of the ink band on the home page, which
 * docs/02-DESIGN-SYSTEM.md limits to exactly two.
 *
 * `wide` is for when it has the row to itself. docs/03-PAGES.md: with fewer
 * than two published testimonials, the ink card fills the row — never
 * placeholder quotes. A 1200px card holding a short vertical stack reads as
 * empty, so at that width the invitation sits beside its button instead.
 * DECISIONS.md D-036.
 */
export function YourTurnCard({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-center gap-3.5 rounded-card bg-ink px-6.5 py-7",
        wide &&
          "lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:px-10 lg:py-9",
      )}
    >
      <div className="flex flex-col gap-3.5">
        <span className="font-mono text-mono-eyebrow text-blue-light uppercase">
          {"// Your turn"}
        </span>
        <h3 className="text-h3 text-white">Worked with me? Say so here.</h3>
        <p className="max-w-sub-wide text-small leading-cozy text-on-ink-body">
          Write a few lines about what we built and how it went. I read every
          one before it appears on this page.
        </p>
      </div>

      <div className={cn("mt-1 self-start", wide && "lg:mt-0 lg:self-center")}>
        <Button
          href="/testimonials#submit"
          variant="inverse"
          size="nav"
          withArrow
        >
          Submit yours
        </Button>
      </div>
    </div>
  );
}
