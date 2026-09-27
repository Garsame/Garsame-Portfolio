import type { EditorNode } from "./editor-content";
import type { ProjectStatusValue, ProjectType } from "./project-rules";
import type {
  ImageView,
  ProjectCardView,
  ProjectDetailView,
} from "./project-view";

/**
 * The project editor's form, and the two things made from it: the payload the
 * server validates and saves, and the view objects the page preview and the
 * card preview draw.
 *
 * Written blocks are editor documents, the same JSON the block editor works
 * in and the same JSON the server stores — nothing is converted on the way
 * through.
 */

export type ContentState = "draft" | "published" | "archived";

export type ProjectForm = {
  id: string | null;
  title: string;
  slug: string;
  client: string;
  year: string;
  type: ProjectType | "";
  status: ProjectStatusValue | "";
  summary: string;
  cover: ImageView | null;
  stack: string[];

  problemHeading: string;
  problem: string;
  bodyHeading: string;
  body: EditorNode | null;

  constraintsHeading: string;
  constraints: EditorNode | null;
  decisions: { key: string; decision: string; reason: string }[];
  outcomeHeading: string;
  outcome: EditorNode | null;
  gallery: { key: string; image: ImageView; caption: string }[];
  liveUrl: string;
  repoUrl: string;
  role: string;
  team: string;
  clientQuoteId: string;
  timeline: string;
  customSections: {
    key: string;
    /** The stored section's id, so its identity survives a reorder. */
    id: string | null;
    heading: string;
    body: EditorNode | null;
    image: ImageView | null;
  }[];

  seoTitle: string;
  seoDescription: string;
  featured: boolean;
};

/** Facts about the saved project the form does not edit directly. */
export type ProjectMeta = {
  state: ContentState;
  slug: string;
  publishedAt: string | null;
  updatedAt: string | null;
  /** 1-based place in the admin list, and the list's length. */
  position: number | null;
  total: number;
};

export type SaveIntent =
  "save" | "publish" | "unpublish" | "archive" | "restore";

export type ProjectPayload = {
  id: string | null;
  intent: SaveIntent;
  title: string;
  slug: string;
  client: string;
  year: number | null;
  type: string;
  status: string;
  summary: string;
  coverId: string | null;
  stack: string[];
  headings: {
    problem: string;
    constraints: string;
    body: string;
    outcome: string;
  };
  problem: string;
  body: EditorNode | null;
  constraints: EditorNode | null;
  decisions: { decision: string; reason: string }[];
  outcome: EditorNode | null;
  gallery: { fileId: string; caption: string }[];
  liveUrl: string;
  repoUrl: string;
  role: string;
  team: string[];
  clientQuoteId: string | null;
  timeline: string;
  customSections: {
    id: string | null;
    heading: string;
    body: EditorNode | null;
    imageId: string | null;
  }[];
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  /** Alt text for every image the project uses, saved onto the file. */
  alts: { id: string; alt: string }[];
};

let counter = 0;
/** A stable React key for a row added in the browser. */
export const newKey = () =>
  `k${Date.now().toString(36)}${(counter++).toString(36)}`;

export function emptyProjectForm(): ProjectForm {
  return {
    id: null,
    title: "",
    slug: "",
    client: "",
    year: String(new Date().getFullYear()),
    type: "",
    status: "",
    summary: "",
    cover: null,
    stack: [],
    problemHeading: "",
    problem: "",
    bodyHeading: "",
    body: null,
    constraintsHeading: "",
    constraints: null,
    decisions: [],
    outcomeHeading: "",
    outcome: null,
    gallery: [],
    liveUrl: "",
    repoUrl: "",
    role: "",
    team: "",
    clientQuoteId: "",
    timeline: "",
    customSections: [],
    seoTitle: "",
    seoDescription: "",
    featured: false,
  };
}

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export function formToPayload(
  form: ProjectForm,
  intent: SaveIntent,
): ProjectPayload {
  const year = Number.parseInt(form.year, 10);
  const images = [
    form.cover,
    ...form.gallery.map((g) => g.image),
    ...form.customSections.map((s) => s.image),
  ].filter((i): i is ImageView => i !== null);

  return {
    id: form.id,
    intent,
    title: form.title,
    slug: form.slug,
    client: form.client,
    year: Number.isFinite(year) ? year : null,
    type: form.type,
    status: form.status,
    summary: form.summary,
    coverId: form.cover?.id ?? null,
    stack: form.stack,
    headings: {
      problem: form.problemHeading,
      constraints: form.constraintsHeading,
      body: form.bodyHeading,
      outcome: form.outcomeHeading,
    },
    problem: form.problem,
    body: form.body,
    constraints: form.constraints,
    decisions: form.decisions
      .filter((d) => d.decision.trim() || d.reason.trim())
      .map((d) => ({ decision: d.decision, reason: d.reason })),
    outcome: form.outcome,
    gallery: form.gallery.map((g) => ({
      fileId: g.image.id,
      caption: g.caption,
    })),
    liveUrl: form.liveUrl,
    repoUrl: form.repoUrl,
    role: form.role,
    team: lines(form.team),
    clientQuoteId: form.clientQuoteId || null,
    timeline: form.timeline,
    customSections: form.customSections
      .filter((s) => s.heading.trim() || s.body || s.image)
      .map((s) => ({
        id: s.id,
        heading: s.heading,
        body: s.body,
        imageId: s.image?.id ?? null,
      })),
    seoTitle: form.seoTitle,
    seoDescription: form.seoDescription,
    featured: form.featured,
    alts: [
      ...new Map(images.map((i) => [i.id, { id: i.id, alt: i.alt }])).values(),
    ],
  };
}

export function formToCardView(form: ProjectForm): ProjectCardView {
  const year = Number.parseInt(form.year, 10);
  return {
    slug: form.slug,
    title: form.title.trim(),
    year: Number.isFinite(year) ? year : null,
    status: form.status || null,
    type: form.type || null,
    summary: form.summary.trim(),
    cover: form.cover,
    featured: form.featured,
  };
}

export function formToDetailView(form: ProjectForm): ProjectDetailView {
  return {
    ...formToCardView(form),
    client: form.client.trim(),
    role: form.role.trim(),
    team: lines(form.team),
    timeline: form.timeline.trim(),
    stack: form.stack,
    headings: {
      problem: form.problemHeading.trim(),
      constraints: form.constraintsHeading.trim(),
      body: form.bodyHeading.trim(),
      outcome: form.outcomeHeading.trim(),
    },
    problem: form.problem,
    constraints: form.constraints,
    body: form.body,
    outcome: form.outcome,
    decisions: form.decisions
      .filter((d) => d.decision.trim())
      .map((d) => ({ decision: d.decision.trim(), reason: d.reason.trim() })),
    gallery: form.gallery.map((g) => ({
      image: g.image,
      caption: g.caption.trim(),
    })),
    liveUrl: form.liveUrl.trim(),
    repoUrl: form.repoUrl.trim(),
    customSections: form.customSections
      .filter((s) => s.heading.trim())
      .map((s) => ({
        key: s.key,
        heading: s.heading.trim(),
        body: s.body,
        image: s.image,
      })),
    seoTitle: form.seoTitle.trim(),
    seoDescription: form.seoDescription.trim(),
  };
}
