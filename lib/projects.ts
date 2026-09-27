import "server-only";

import { cache } from "react";
import type { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { isEditorDoc, type EditorNode } from "@/lib/editor-content";
import type {
  ImageView,
  ProjectCardView,
  ProjectDetailView,
  ProjectPageContext,
  ProjectQuoteView,
} from "@/lib/project-view";
import { MAX_FEATURED_PROJECTS } from "@/lib/project-rules";
import {
  Project,
  StoredFile,
  Testimonial,
  type IFile,
  type IProject,
} from "@/models";

/**
 * Public project data — only ever `state: "published"`.
 *
 * The order is docs/03-PAGES.md: "All published projects, newest first within
 * the admin's manual order. Featured projects appear first." New projects go
 * to the top of the manual order when created, so the manual order already
 * reads newest first until Garsame drags something.
 */

type FileLean = Pick<
  IFile,
  "url" | "width" | "height" | "alt" | "originalName" | "mimeType"
> & { _id: Types.ObjectId };

export function toImageView(
  file: FileLean | null | undefined,
): ImageView | null {
  if (!file?.url || !file.width || !file.height) return null;
  return {
    id: String(file._id),
    url: file.url,
    width: file.width,
    height: file.height,
    alt: file.alt ?? "",
    name: file.originalName,
    mimeType: file.mimeType,
  };
}

const FILE_FIELDS = "url width height alt originalName mimeType";
const PUBLIC_ORDER = { featured: -1, position: 1 } as const;

type ProjectLean = Omit<
  IProject,
  "coverImage" | "gallery" | "customSections"
> & {
  _id: Types.ObjectId;
  coverImage?: FileLean | null;
  gallery: { file: FileLean | null; caption?: string }[];
  customSections: {
    _id?: Types.ObjectId;
    heading: string;
    body?: unknown;
    image?: FileLean | null;
  }[];
};

const doc = (value: unknown): EditorNode | null =>
  isEditorDoc(value) ? value : null;

function toCardView(p: ProjectLean): ProjectCardView {
  return {
    slug: p.slug,
    title: p.title,
    year: p.year ?? null,
    status: p.status ?? null,
    type: p.type ?? null,
    summary: p.summary ?? "",
    cover: toImageView(p.coverImage),
    featured: p.featured,
  };
}

function toDetailView(p: ProjectLean): ProjectDetailView {
  return {
    ...toCardView(p),
    client: p.client ?? "",
    role: p.role ?? "",
    team: p.team ?? [],
    timeline: p.timeline ?? "",
    stack: p.stack ?? [],
    headings: {
      problem: p.headings?.problem ?? "",
      constraints: p.headings?.constraints ?? "",
      body: p.headings?.body ?? "",
      outcome: p.headings?.outcome ?? "",
    },
    problem: p.problem ?? "",
    constraints: doc(p.constraints),
    body: doc(p.body),
    outcome: doc(p.outcome),
    decisions: (p.decisions ?? []).map((d) => ({
      decision: d.decision,
      reason: d.reason ?? "",
    })),
    gallery: (p.gallery ?? []).flatMap((g) => {
      const image = toImageView(g.file);
      return image ? [{ image, caption: g.caption ?? "" }] : [];
    }),
    liveUrl: p.liveUrl ?? "",
    repoUrl: p.repoUrl ?? "",
    customSections: (p.customSections ?? []).map((s, i) => ({
      key: s._id ? String(s._id) : `section-${i}`,
      heading: s.heading,
      body: doc(s.body),
      image: toImageView(s.image),
    })),
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
  };
}

/* Registers File with Mongoose before populate() needs it. */
void StoredFile;

/** Every published project, in public order. */
export const getPublishedProjects = cache(
  async (): Promise<ProjectCardView[]> => {
    await dbConnect();
    const rows = await Project.find({ state: "published" })
      .sort(PUBLIC_ORDER)
      .select("slug title year status type summary coverImage featured")
      .populate("coverImage", FILE_FIELDS)
      .lean<ProjectLean[]>();
    return rows.map(toCardView);
  },
);

/** The home page's three, in the admin's order. */
export const getFeaturedProjects = cache(
  async (): Promise<ProjectCardView[]> => {
    const all = await getPublishedProjects();
    return all.filter((p) => p.featured).slice(0, MAX_FEATURED_PROJECTS);
  },
);

export const getPublishedSlugs = cache(async (): Promise<string[]> => {
  const all = await getPublishedProjects();
  return all.map((p) => p.slug);
});

/** One published project and everything around it on its page. */
export const getProjectPage = cache(
  async (
    slug: string,
  ): Promise<{
    project: ProjectDetailView;
    context: ProjectPageContext;
  } | null> => {
    await dbConnect();
    const row = await Project.findOne({ slug, state: "published" })
      .populate("coverImage", FILE_FIELDS)
      .populate("gallery.file", FILE_FIELDS)
      .populate("customSections.image", FILE_FIELDS)
      .lean<ProjectLean>();
    if (!row) return null;

    const list = await getPublishedProjects();
    const index = Math.max(
      0,
      list.findIndex((p) => p.slug === row.slug),
    );
    const neighbour = (i: number) => {
      const p = list[i];
      return p ? { slug: p.slug, title: p.title, summary: p.summary } : null;
    };

    return {
      project: toDetailView(row),
      context: {
        index,
        quote: await publishedQuote(row),
        previous: neighbour(index - 1),
        next: neighbour(index + 1),
      },
    };
  },
);

/**
 * docs/03-PAGES.md: "a testimonial from that client if one is published".
 * The one chosen in the editor when it is still published; otherwise the
 * first published testimonial linked to this project. Never a pending one —
 * CLAUDE.md rule 6.
 */
async function publishedQuote(
  p: ProjectLean,
): Promise<ProjectQuoteView | null> {
  type QuoteLean = {
    quote: string;
    name: string;
    role?: string;
    business?: string;
    photo?: FileLean | null;
  };
  const select = "quote name role business photo";

  const chosen = p.clientQuote
    ? await Testimonial.findOne({ _id: p.clientQuote, status: "published" })
        .select(select)
        .populate("photo", FILE_FIELDS)
        .lean<QuoteLean>()
    : null;

  const t =
    chosen ??
    (await Testimonial.findOne({ project: p._id, status: "published" })
      .sort({ position: 1 })
      .select(select)
      .populate("photo", FILE_FIELDS)
      .lean<QuoteLean>());

  if (!t) return null;
  return {
    quote: t.quote,
    name: t.name,
    role: t.role ?? "",
    business: t.business ?? "",
    photo: toImageView(t.photo),
  };
}
