import {
  ArrowUpRight,
  Badge,
  Card,
  CardCover,
  StatusChip,
} from "@/components/ui";
import { PROJECT_TYPE_LABELS } from "@/lib/project-rules";
import { indexTag, type ProjectCardView } from "@/lib/project-view";
import { CoverImage } from "./CoverImage";

/**
 * A project card — design/01-home.html section 04 and design/04-projects.html.
 *
 * The whole card is the link, so "See the project" is a span and not a nested
 * anchor. The same component draws the home page's featured three, the
 * /projects grid and the card preview in the admin editor.
 */
export function ProjectCard({
  project,
  index,
  showType = false,
  showFeatured = false,
  href,
}: {
  project: ProjectCardView;
  /** Position in the public list, 0-based — the "/ 001" index tag. */
  index: number;
  /** "2026 · Platform" on /projects; the home page shows the year alone. */
  showType?: boolean;
  /** The "Featured" badge, drawn on /projects only. */
  showFeatured?: boolean;
  /** Where the card goes. The admin preview passes null: nowhere. */
  href?: string | null;
}) {
  const meta = [
    project.year,
    showType && project.type ? PROJECT_TYPE_LABELS[project.type] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card
      href={href === null ? undefined : (href ?? `/projects/${project.slug}`)}
      interactive={href === null}
      className="h-full overflow-hidden"
    >
      <CardCover
        overlay={
          <>
            <span className="absolute top-4 left-4 font-mono text-mono-meta font-semibold tracking-none text-blue">
              {indexTag(index)}
            </span>
            {showFeatured && project.featured ? (
              <Badge tone="solid" className="absolute top-3.5 right-3.5">
                Featured
              </Badge>
            ) : null}
          </>
        }
      >
        <CoverImage
          image={project.cover}
          sizes="(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw"
        />
      </CardCover>

      <div className="flex flex-1 flex-col gap-2.5 p-5.5">
        <div className="flex items-center gap-2">
          {project.status ? <StatusChip status={project.status} /> : null}
          {meta ? (
            <span className="font-mono text-mono-meta font-regular tracking-none text-muted">
              {meta}
            </span>
          ) : null}
        </div>

        <h3 className="text-h3 text-ink">{project.title || "Untitled"}</h3>

        {project.summary ? (
          <p className="text-small text-ink-body">{project.summary}</p>
        ) : null}

        {/* mt-auto keeps the CTA on one baseline across a row of cards whose
            summaries run to different lengths. */}
        <span className="mt-auto flex items-center gap-2 pt-1.5 text-small font-semibold text-blue">
          See the project
          <ArrowUpRight size={13} />
        </span>
      </div>
    </Card>
  );
}
