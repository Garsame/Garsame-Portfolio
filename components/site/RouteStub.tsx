import { Badge, Button } from "@/components/ui";
import { Section } from "./Section";

/**
 * Scaffolding — Phase 2.
 *
 * Every route from docs/03-PAGES.md exists and navigates before any section is
 * built, so the shell can be checked as a whole. Each stub says which phase
 * fills it in.
 *
 * It holds no site copy on purpose. CLAUDE.md rule 10: never invent content.
 * A placeholder that looks like real marketing text is worse than one that
 * plainly says it is a placeholder, because it can be mistaken for approved
 * copy and shipped.
 *
 * Delete this component once the last route is built.
 */
export function RouteStub({
  route,
  title,
  phase,
  contains,
}: {
  route: string;
  title: string;
  /** The phase in docs/06-BUILD-PROMPTS.md that builds this page. */
  phase: string;
  /** What docs/03-PAGES.md says this page will hold. */
  contains: string[];
}) {
  return (
    <Section tone="gradient" pad="hero" innerClassName="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-mono-label text-blue uppercase">
          {route}
        </span>
        <Badge tone="neutral">{phase}</Badge>
      </div>

      <h1 className="text-h1-sm lg:text-h1">{title}</h1>

      <p className="max-w-sub-wide text-body-lg text-ink-body">
        This route exists so the shell can be navigated end to end. The page
        itself is built in {phase}.
      </p>

      <ul className="flex max-w-sub-wide flex-col gap-2 border-t border-border pt-6">
        {contains.map((item) => (
          <li
            key={item}
            className="flex gap-3 text-small leading-normal text-ink-body"
          >
            <span aria-hidden="true" className="font-mono text-muted">
              ·
            </span>
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button href="/" variant="secondary" size="sm">
          Back to home
        </Button>
        <Button href="/dev/ui" variant="ghost" size="sm" withArrow>
          The UI kit
        </Button>
      </div>
    </Section>
  );
}
