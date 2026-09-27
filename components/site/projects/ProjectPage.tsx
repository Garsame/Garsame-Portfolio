import Image from "next/image";
import Link from "next/link";
import { Card, StatusChip } from "@/components/ui";
import { CoverImage } from "@/components/site/CoverImage";
import { EditorContent } from "@/components/site/EditorContent";
import { Section } from "@/components/site/Section";
import { ImageGlyph, QuoteMark } from "@/components/site/icons";
import { PROJECT_TYPE_LABELS } from "@/lib/project-rules";
import {
  indexTag,
  type ProjectDetailView,
  type ProjectPageContext,
} from "@/lib/project-view";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { OnThisPage } from "./OnThisPage";

/**
 * One project case study — docs/03-PAGES.md `/projects/[slug]`, drawn from
 * design/05-project-detail.html.
 *
 * "Header on the ink band: client, year, status, title, summary. Then, in
 * order, rendering only the blocks that have content." An empty block renders
 * nothing at all — no heading, no placeholder — so a short case study is short
 * rather than full of gaps.
 *
 * The same component is the admin's page preview. It takes plain view objects
 * and uses nothing that only runs on the server, and `preview` turns its links
 * into text so a click inside the preview cannot leave unsaved work.
 */

type Block = {
  id: string;
  label: string;
  /** Shown as a mono eyebrow above the heading; custom sections have none. */
  eyebrow: boolean;
  heading: string;
  content: React.ReactNode;
};

/** "//" eyebrow + heading + content, as every block in the design is drawn. */
function CaseBlock({ block }: { block: Block }) {
  const headingId = `${block.id}-heading`;
  return (
    <section
      id={block.id}
      aria-labelledby={headingId}
      className="flex scroll-mt-rail-top flex-col gap-3.5"
    >
      {block.eyebrow && block.heading ? (
        <>
          <span className="font-mono text-mono-label text-blue uppercase">
            <span aria-hidden="true">{"// "}</span>
            {block.label}
          </span>
          <h2 id={headingId} className="text-h2-sm text-ink lg:text-h2">
            {block.heading}
          </h2>
        </>
      ) : block.eyebrow ? (
        <h2
          id={headingId}
          className="font-mono text-mono-label text-blue uppercase"
        >
          <span aria-hidden="true">{"// "}</span>
          {block.label}
        </h2>
      ) : (
        <h2 id={headingId} className="text-h2-sm text-ink lg:text-h2">
          {block.heading}
        </h2>
      )}
      {block.content}
    </section>
  );
}

const PROSE = "text-article-sm leading-case text-ink-3";

/** Plain text with blank lines between paragraphs — the problem field. */
function Paragraphs({ text }: { text: string }) {
  return (
    <div className={cn("flex flex-col gap-4.5", PROSE)}>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-mono-chip tracking-wide text-muted uppercase">
      {children}
    </span>
  );
}

/** A link, or plain text inside the admin preview. */
function MaybeLink({
  href,
  preview,
  className,
  children,
  external = false,
}: {
  href: string;
  preview: boolean;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (preview) return <span className={className}>{children}</span>;
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function ProjectPage({
  project,
  context,
  preview = false,
}: {
  project: ProjectDetailView;
  context: ProjectPageContext;
  preview?: boolean;
}) {
  const { headings } = project;

  /* ---- the main column, in the order docs/03-PAGES.md sets ---- */
  const blocks: Block[] = [];

  if (project.problem.trim()) {
    blocks.push({
      id: "the-problem",
      label: "The problem",
      eyebrow: true,
      heading: headings.problem,
      content: <Paragraphs text={project.problem} />,
    });
  }
  if (project.constraints) {
    blocks.push({
      id: "what-i-cut",
      label: "What I cut",
      eyebrow: true,
      heading: headings.constraints,
      content: <EditorContent doc={project.constraints} className={PROSE} />,
    });
  }
  if (project.body) {
    blocks.push({
      id: "what-i-built",
      label: "What I built",
      eyebrow: true,
      heading: headings.body,
      content: <EditorContent doc={project.body} className={PROSE} />,
    });
  }
  if (project.decisions.length > 0) {
    blocks.push({
      id: "key-decisions",
      label: "Key decisions",
      eyebrow: true,
      heading: "",
      content: (
        <ul className="flex flex-col gap-3">
          {project.decisions.map((d, i) => (
            <li
              key={i}
              className="flex flex-col gap-1.75 rounded-tile border border-border bg-tint-soft px-6 py-5.5"
            >
              <h3 className="text-body-lg font-bold text-ink">{d.decision}</h3>
              {d.reason ? (
                <p className="text-small leading-relaxed text-ink-body">
                  {d.reason}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (project.outcome) {
    blocks.push({
      id: "outcome",
      label: "Outcome",
      eyebrow: true,
      heading: headings.outcome,
      content: <EditorContent doc={project.outcome} className={PROSE} />,
    });
  }
  if (project.gallery.length > 0) {
    blocks.push({
      id: "gallery",
      label: "Gallery",
      eyebrow: true,
      heading: "",
      content: (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {project.gallery.map(({ image, caption }) => (
            <figure key={image.id} className="flex flex-col gap-2">
              <div className="overflow-hidden rounded-tile bg-accent-soft">
                <Image
                  src={image.url}
                  width={image.width}
                  height={image.height}
                  alt={image.alt}
                  sizes="(min-width: 1024px) 333px, (min-width: 640px) 50vw, 100vw"
                  unoptimized={image.mimeType === "image/svg+xml"}
                  className="h-auto w-full"
                />
              </div>
              {caption ? (
                <figcaption className="text-caption text-ink-body">
                  {caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ),
    });
  }

  const usedIds = new Set(blocks.map((b) => b.id));
  for (const section of project.customSections) {
    if (!section.heading.trim()) continue;
    const base = `section-${slugify(section.heading) || "more"}`;
    let id = base;
    for (let n = 2; usedIds.has(id); n += 1) id = `${base}-${n}`;
    usedIds.add(id);
    blocks.push({
      id,
      label: section.heading,
      eyebrow: false,
      heading: section.heading,
      content: (
        <div className="flex flex-col gap-4.5">
          {section.image ? (
            <div className="overflow-hidden rounded-tile bg-accent-soft">
              <Image
                src={section.image.url}
                width={section.image.width}
                height={section.image.height}
                alt={section.image.alt}
                sizes="(min-width: 1024px) 680px, 100vw"
                unoptimized={section.image.mimeType === "image/svg+xml"}
                className="h-auto w-full"
              />
            </div>
          ) : null}
          <EditorContent doc={section.body} className={PROSE} />
        </div>
      ),
    });
  }

  /* ---- the rail: stack, role and team, timeline, links ---- */
  const hasStack = project.stack.length > 0;
  const hasTeam = project.team.length > 0;
  const links = [
    project.liveUrl
      ? { href: project.liveUrl, label: "Visit the live site" }
      : null,
    project.repoUrl
      ? { href: project.repoUrl, label: "Read the source code" }
      : null,
  ].filter((l): l is { href: string; label: string } => l !== null);
  type RailRow = { label: string; body: React.ReactNode };
  const railRows = (
    [
      hasTeam
        ? {
            label: "Team",
            body: (
              <ul className="flex flex-col">
                {project.team.map((member, i) => (
                  <li key={i}>{member}</li>
                ))}
              </ul>
            ),
          }
        : null,
      project.timeline ? { label: "Timeline", body: project.timeline } : null,
      links.length > 0
        ? {
            label: "Links",
            body: (
              <ul className="flex flex-col gap-1">
                {links.map((link) => (
                  <li key={link.href}>
                    <MaybeLink
                      href={link.href}
                      preview={preview}
                      external
                      className="font-semibold text-blue transition-button hover:text-blue-hover"
                    >
                      {link.label} ↗
                    </MaybeLink>
                  </li>
                ))}
              </ul>
            ),
          }
        : null,
    ] as (RailRow | null)[]
  ).filter((r): r is RailRow => r !== null);
  const hasRail = hasStack || railRows.length > 0;

  const headerFacts = [
    project.client ? { label: "Client", value: project.client } : null,
    project.type
      ? { label: "Type", value: PROJECT_TYPE_LABELS[project.type] }
      : null,
    project.role ? { label: "My role", value: project.role } : null,
  ].filter((f): f is { label: string; value: string } => f !== null);

  const { quote, previous, next } = context;

  return (
    <>
      {/* ---- header, on the ink band ---- */}
      <Section
        tone="ink"
        pad="none"
        className="py-section-sm lg:pt-14 lg:pb-16"
      >
        <nav aria-label="Breadcrumb" className="mb-6.5">
          <ol className="flex flex-wrap items-center gap-2.25 text-caption text-on-ink-meta">
            <li>
              <MaybeLink
                href="/projects"
                preview={preview}
                className="transition-button hover:text-white"
              >
                Projects
              </MaybeLink>
            </li>
            <li aria-hidden="true" className="text-ink-2">
              /
            </li>
            <li aria-current="page" className="text-white">
              {project.title || "Untitled"}
            </li>
          </ol>
        </nav>

        <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:gap-14">
          <div className="flex flex-col gap-4.5">
            <div className="flex flex-wrap items-center gap-2.25">
              <span className="font-mono text-mono-meta font-semibold tracking-none text-blue-light">
                {indexTag(context.index)}
              </span>
              {project.status ? (
                <StatusChip status={project.status} tone="ink" />
              ) : null}
              {project.year ? (
                <span className="font-mono text-mono-meta font-regular tracking-none text-on-ink-meta">
                  {project.year}
                </span>
              ) : null}
            </div>
            <h1 className="text-display-sm text-balance text-white lg:text-page-title">
              {project.title || "Untitled"}
            </h1>
            {project.summary ? (
              <p className="max-w-lead text-article-sm text-on-ink-lead">
                {project.summary}
              </p>
            ) : null}
          </div>

          {headerFacts.length > 0 ? (
            <dl className="flex flex-col gap-4.5">
              {headerFacts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-1">
                  <dt className="font-mono text-mono-chip tracking-wide text-on-ink-label uppercase">
                    {fact.label}
                  </dt>
                  <dd className="text-body font-semibold text-white">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </Section>

      {/* ---- cover ---- */}
      <div className="flex h-cover-detail-sm flex-col items-center justify-center gap-2.5 overflow-hidden border-b border-border-strong bg-accent-wash md:h-cover-detail">
        {project.cover ? (
          <CoverImage image={project.cover} sizes="100vw" eager />
        ) : (
          <>
            <ImageGlyph size={52} className="text-placeholder-ink" />
            <span className="font-mono text-caption tracking-mono text-placeholder-ink">
              [ COVER SCREENSHOT ]
            </span>
          </>
        )}
      </div>

      {/* ---- the case study, with the rail beside it ---- */}
      {blocks.length > 0 || hasRail ? (
        <Section tone="white" pad="none" className="py-section-sm lg:py-19">
          <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_var(--spacing-rail)] lg:gap-18">
            <div className="flex max-w-article flex-col gap-11.5">
              {blocks.map((block) => (
                <CaseBlock key={block.id} block={block} />
              ))}
            </div>

            {hasRail || blocks.length > 1 ? (
              <aside className="flex flex-col gap-4 lg:sticky lg:top-rail-top">
                {hasRail ? (
                  <div className="flex flex-col gap-4 rounded-card border border-border bg-tint-soft p-6">
                    {hasStack ? (
                      <div className="flex flex-col gap-2.25">
                        <RailLabel>Stack</RailLabel>
                        <ul className="flex flex-wrap gap-1.5">
                          {project.stack.map((tag) => (
                            <li
                              key={tag}
                              className="rounded-chip border border-border bg-white px-2.25 py-1.25 font-mono text-mono-meta font-regular tracking-none text-prose-2"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {hasStack && railRows.length > 0 ? (
                      <hr className="border-border" />
                    ) : null}
                    {railRows.map((row) => (
                      <div key={row.label} className="flex flex-col gap-1.25">
                        <RailLabel>{row.label}</RailLabel>
                        <div className="text-small leading-normal text-ink-3">
                          {row.body}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {blocks.length > 1 ? (
                  <OnThisPage
                    items={blocks.map((b) => ({ id: b.id, label: b.label }))}
                  />
                ) : null}
              </aside>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* ---- a published testimonial from this client ---- */}
      {quote ? (
        <Section tone="tint" pad="none" className="py-section-sm lg:py-16">
          <figure className="mx-auto flex max-w-quote flex-col items-center gap-4.5 text-center">
            <QuoteMark className="text-blue-wash" />
            <blockquote className="text-quote text-pretty text-prose">
              {quote.quote}
            </blockquote>
            <figcaption className="flex items-center gap-3 pt-1.5 text-left">
              {quote.photo ? (
                <Image
                  src={quote.photo.url}
                  width={quote.photo.width}
                  height={quote.photo.height}
                  alt=""
                  sizes="44px"
                  className="size-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="size-11 shrink-0 rounded-full bg-avatar-1"
                />
              )}
              <span className="flex flex-col gap-0.5">
                <span className="text-body font-bold text-ink">
                  {quote.name}
                </span>
                {quote.role || quote.business ? (
                  <span className="font-mono text-mono-meta font-regular tracking-none text-muted">
                    {[quote.role, quote.business].filter(Boolean).join(", ")}
                  </span>
                ) : null}
              </span>
            </figcaption>
          </figure>
        </Section>
      ) : null}

      {/* ---- previous / next ---- */}
      {previous || next ? (
        <Section
          tone="white"
          pad="none"
          className="border-t border-border-header py-section-sm lg:py-14"
        >
          <nav aria-label="More projects" className="grid gap-5 sm:grid-cols-2">
            {previous ? (
              <NeighbourCard
                direction="previous"
                neighbour={previous}
                preview={preview}
              />
            ) : null}
            {next ? (
              <div className="sm:col-start-2">
                <NeighbourCard
                  direction="next"
                  neighbour={next}
                  preview={preview}
                />
              </div>
            ) : null}
          </nav>
        </Section>
      ) : null}
    </>
  );
}

function NeighbourCard({
  direction,
  neighbour,
  preview,
}: {
  direction: "previous" | "next";
  neighbour: { slug: string; title: string; summary: string };
  preview: boolean;
}) {
  const isNext = direction === "next";
  return (
    <Card
      href={preview ? undefined : `/projects/${neighbour.slug}`}
      className="h-full"
    >
      <div
        className={cn(
          "flex flex-col gap-2 p-6.5",
          isNext && "items-end text-right",
        )}
      >
        <span className="font-mono text-mono-meta font-regular tracking-none text-muted">
          {isNext ? "NEXT →" : "← PREVIOUS"}
        </span>
        <span className="text-client text-ink">{neighbour.title}</span>
        {neighbour.summary ? (
          <span className="text-small text-ink-body">{neighbour.summary}</span>
        ) : null}
      </div>
    </Card>
  );
}
