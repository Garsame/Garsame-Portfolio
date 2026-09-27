import type { EditorNode } from "./editor-content";
import type { ProjectStatusValue, ProjectType } from "./project-rules";

/**
 * What a project page and a project card are drawn from.
 *
 * Plain, serialisable objects with no database types in them, for two
 * reasons: a server component can hand them to a client component, and the
 * admin editor can build exactly the same objects from its unsaved form. The
 * page preview is then the public page component itself, not a copy of it —
 * docs/04-ADMIN.md, "the exact public post rendered from the current form".
 */

export type ImageView = {
  id: string;
  url: string;
  width: number;
  height: number;
  /** Empty means decorative — rendered as alt="". */
  alt: string;
  /** The uploader's filename, for the admin. */
  name: string;
  mimeType: string;
};

export type ProjectCardView = {
  slug: string;
  title: string;
  year: number | null;
  status: ProjectStatusValue | null;
  type: ProjectType | null;
  summary: string;
  cover: ImageView | null;
  featured: boolean;
};

export type ProjectHeadingsView = {
  problem: string;
  constraints: string;
  body: string;
  outcome: string;
};

export type ProjectQuoteView = {
  quote: string;
  name: string;
  role: string;
  business: string;
  photo: ImageView | null;
};

export type ProjectNeighbourView = {
  slug: string;
  title: string;
  summary: string;
};

export type ProjectDetailView = ProjectCardView & {
  client: string;
  role: string;
  team: string[];
  timeline: string;
  stack: string[];
  headings: ProjectHeadingsView;
  problem: string;
  constraints: EditorNode | null;
  body: EditorNode | null;
  outcome: EditorNode | null;
  decisions: { decision: string; reason: string }[];
  gallery: { image: ImageView; caption: string }[];
  liveUrl: string;
  repoUrl: string;
  customSections: {
    key: string;
    heading: string;
    body: EditorNode | null;
    image: ImageView | null;
  }[];
  seoTitle: string;
  seoDescription: string;
};

/** Everything around the project itself on its public page. */
export type ProjectPageContext = {
  /** 0-based position in the public list — the "/ 002" index tag. */
  index: number;
  quote: ProjectQuoteView | null;
  previous: ProjectNeighbourView | null;
  next: ProjectNeighbourView | null;
};

/** "/ 002" */
export const indexTag = (index: number) =>
  `/ ${String(index + 1).padStart(3, "0")}`;
