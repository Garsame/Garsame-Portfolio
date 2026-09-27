import Image from "next/image";
import { Button, Card, SectionHeading } from "@/components/ui";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Reveal, RevealItem } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { ImageGlyph } from "@/components/site/icons";
import { process as defaultProcess, versions } from "@/lib/content/home";
import type { ProjectCardView } from "@/lib/project-view";
import type { PopulatedFile, PublicSiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

/* ======================================================================
   04 Projects — white.
   ====================================================================== */

export function FeaturedProjects({
  projects,
}: {
  projects: ProjectCardView[];
}) {
  return (
    <Section tone="white" aria-labelledby="projects-heading">
      <div className="mb-10.5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <SectionHeading
          eyebrow="Projects"
          heading="Systems that are"
          accent="running"
          id="projects-heading"
        />
        <div className="shrink-0">
          <Button href="/projects" variant="secondary" size="sm" withArrow>
            See all projects
          </Button>
        </div>
      </div>

      {projects.length > 0 ? (
        <Reveal className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <RevealItem key={project.slug} className="h-full">
              <ProjectCard project={project} index={i} />
            </RevealItem>
          ))}
        </Reveal>
      ) : null}
    </Section>
  );
}

/* ======================================================================
   05 The three versions — tint.
   ====================================================================== */

export function ThreeVersions() {
  return (
    <Section tone="tint" aria-labelledby="versions-heading">
      <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-15">
        <div className="flex flex-col gap-4.25">
          <SectionHeading
            eyebrow="About me"
            heading="Why the name says"
            accent="v3"
            id="versions-heading"
          />
          <p className="text-body leading-loose text-pretty text-ink-body">
            {versions.paragraph}
          </p>
          <div className="pt-1">
            <Button href="/about" variant="ghost" withArrow>
              Read the full story
            </Button>
          </div>
        </div>

        <Reveal as="ul" className="flex flex-col gap-3.25">
          {versions.items.map((item) => {
            const current = item.tag === "v3";
            return (
              <RevealItem as="li" key={item.tag}>
                <Card
                  tone={current ? "accent-soft" : "white"}
                  className="px-6 py-5.5"
                >
                  <div className="flex items-start gap-5">
                    <span
                      className={cn(
                        "pt-0.5 font-mono text-caption",
                        current
                          ? "font-bold text-blue"
                          : "font-semibold text-faint",
                      )}
                    >
                      {item.tag}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-h5 text-ink">{item.title}</h3>
                      <p
                        className={cn(
                          "text-small leading-cozy",
                          current ? "text-on-ink-soft" : "text-ink-body",
                        )}
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Card>
              </RevealItem>
            );
          })}
        </Reveal>
      </div>
    </Section>
  );
}

/* ======================================================================
   06 Full-bleed break — accent-wash. Reads breakImage from Settings (Phase 9).
   ====================================================================== */

export function BreakBand({ breakImage }: { breakImage?: PopulatedFile | null }) {
  if (breakImage?.url) {
    return (
      <section
        aria-label="Full-width project showcase"
        className="relative h-break-sm w-full overflow-hidden md:h-break"
      >
        <Image
          src={breakImage.url}
          alt={breakImage.originalName || "Project interface screenshot"}
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
      </section>
    );
  }

  return (
    <Section
      tone="accent-wash"
      pad="none"
      className="flex h-break-sm flex-col justify-center md:h-break"
      innerClassName="flex flex-col items-center gap-3 text-center"
    >
      <ImageGlyph className="text-placeholder-ink" />
      <span className="font-mono text-caption tracking-mono text-placeholder-ink">
        [ FULL-WIDTH PROJECT SCREENSHOT ]
      </span>
      <span className="text-caption text-placeholder-ink-3">
        your strongest interface, edge to edge
      </span>
    </Section>
  );
}

const DEFAULT_STEPS: PublicSiteSettings["processSteps"] =
  defaultProcess.steps.map((s, i) => ({
    ...s,
    order: i + 1,
  }));

export function Process({
  steps = DEFAULT_STEPS,
}: {
  steps?: PublicSiteSettings["processSteps"];
}) {
  return (
    <Section tone="white" aria-labelledby="process-heading">
      <SectionHeading
        align="center"
        eyebrow="Process"
        heading="How we get"
        accent="there"
        sub={defaultProcess.sub}
        subMaxWidth="max-w-sub-md"
        className="mb-12"
        id="process-heading"
      />

      <Reveal
        as="ul"
        className="grid gap-x-4 gap-y-8 md:grid-cols-2 lg:grid-cols-5"
      >
        {steps.map((step, i) => {
          const first = i === 0;
          return (
            <RevealItem
              as="li"
              key={step.title}
              className={cn(
                "flex flex-col gap-2.75 border-t-2 pt-4.5",
                first ? "border-blue" : "border-blue-pale",
              )}
            >
              <span
                className={cn(
                  "font-mono text-mono-label font-semibold tracking-none",
                  first ? "text-blue" : "text-muted",
                )}
              >
                {`STEP ${String(i + 1).padStart(2, "0")}`}
              </span>
              <h3 className="text-h5 text-ink">{step.title}</h3>
              <p className="text-small text-ink-body">{step.description}</p>
            </RevealItem>
          );
        })}
      </Reveal>
    </Section>
  );
}
