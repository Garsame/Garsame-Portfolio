import "server-only";

import mongoose, { type Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { dbConnect } from "@/lib/db";
import { isEditorDoc, type EditorNode } from "@/lib/editor-content";
import { MAX_DOC_BYTES, sanitizeDoc } from "@/lib/editor-schema";
import {
  emptyProjectForm,
  newKey,
  type ContentState,
  type ProjectForm,
  type ProjectMeta,
  type ProjectPayload,
  type SaveIntent,
} from "@/lib/project-form";
import {
  MAX_FEATURED_PROJECTS,
  PROJECT_SEO_DESCRIPTION_MAX,
  PROJECT_SEO_TITLE_MAX,
  PROJECT_STATUSES,
  PROJECT_SUMMARY_MAX,
  PROJECT_TITLE_MAX,
  PROJECT_TYPES,
  type ProjectStatusValue,
  type ProjectType,
} from "@/lib/project-rules";
import type { ImageView } from "@/lib/project-view";
import { toImageView } from "@/lib/projects";
import { isSlug, slugify } from "@/lib/slug";
import {
  Project,
  RuleViolation,
  StoredFile,
  Testimonial,
  type IFile,
} from "@/models";

/**
 * The admin side of Projects — docs/04-ADMIN.md §5.
 *
 * Every function starts with requireAdmin(). The save path trusts nothing the
 * browser sends (docs/04-ADMIN.md, "Validate every field on the server"): the
 * payload is checked field by field here, editor documents are sanitised, and
 * every file and testimonial id is looked up before it is stored. The publish
 * rules, the featured limit and slug uniqueness are then enforced by the
 * model's own save hook, which nothing can go around.
 */

const FILE_FIELDS = "url width height alt originalName mimeType";

type FileLean = Pick<
  IFile,
  "url" | "width" | "height" | "alt" | "originalName" | "mimeType"
> & {
  _id: Types.ObjectId;
};

/* ------------------------------------------------------------------ list */

export type AdminProjectRow = {
  id: string;
  slug: string;
  title: string;
  client: string;
  type: ProjectType | null;
  status: ProjectStatusValue | null;
  state: ContentState;
  featured: boolean;
  cover: ImageView | null;
};

/** Every project, featured first, each group in the manual order. */
export async function listAdminProjects(): Promise<AdminProjectRow[]> {
  await requireAdmin();
  await dbConnect();
  const rows = await Project.find()
    .sort({ featured: -1, position: 1 })
    .select("slug title client type status state featured coverImage")
    .populate("coverImage", FILE_FIELDS)
    .lean<
      {
        _id: Types.ObjectId;
        slug: string;
        title: string;
        client?: string;
        type?: ProjectType;
        status?: ProjectStatusValue;
        state: ContentState;
        featured: boolean;
        coverImage?: FileLean | null;
      }[]
    >();

  return rows.map((p) => ({
    id: String(p._id),
    slug: p.slug,
    title: p.title,
    client: p.client ?? "",
    type: p.type ?? null,
    status: p.status ?? null,
    state: p.state,
    featured: p.featured,
    cover: toImageView(p.coverImage),
  }));
}

/* ---------------------------------------------------------------- editor */

export type TestimonialOption = { id: string; label: string };

export type EditorData = {
  form: ProjectForm;
  meta: ProjectMeta;
  testimonials: TestimonialOption[];
};

/* What the editor is handed: the stored document, or nothing. */
const storedDoc = (value: unknown): EditorNode | null =>
  isEditorDoc(value) ? value : null;

const isObjectId = (v: unknown): v is string =>
  typeof v === "string" &&
  mongoose.isValidObjectId(v) &&
  /^[0-9a-f]{24}$/i.test(v);

async function testimonialOptions(): Promise<TestimonialOption[]> {
  const rows = await Testimonial.find({ status: "published" })
    .sort({ position: 1, createdAt: -1 })
    .select("name business")
    .lean<{ _id: Types.ObjectId; name: string; business?: string }[]>();
  return rows.map((t) => ({
    id: String(t._id),
    label: t.business ? `${t.name}, ${t.business}` : t.name,
  }));
}

export async function getNewProjectData(): Promise<EditorData> {
  await requireAdmin();
  await dbConnect();
  return {
    form: emptyProjectForm(),
    meta: {
      state: "draft",
      slug: "",
      publishedAt: null,
      updatedAt: null,
      position: null,
      total: await Project.countDocuments(),
    },
    testimonials: await testimonialOptions(),
  };
}

/** Null when there is no project with that id. */
export async function getProjectEditorData(
  id: string,
): Promise<EditorData | null> {
  await requireAdmin();
  if (!isObjectId(id)) return null;
  await dbConnect();

  const p = await Project.findById(id)
    .populate("coverImage", FILE_FIELDS)
    .populate("gallery.file", FILE_FIELDS)
    .populate("customSections.image", FILE_FIELDS)
    .lean<{
      _id: Types.ObjectId;
      title: string;
      slug: string;
      client?: string;
      year?: number;
      type?: ProjectType;
      status?: ProjectStatusValue;
      summary?: string;
      coverImage?: FileLean | null;
      stack?: string[];
      headings?: {
        problem?: string;
        constraints?: string;
        body?: string;
        outcome?: string;
      };
      problem?: string;
      body?: unknown;
      constraints?: unknown;
      decisions?: { decision: string; reason?: string }[];
      outcome?: unknown;
      gallery?: { file: FileLean | null; caption?: string }[];
      liveUrl?: string;
      repoUrl?: string;
      role?: string;
      team?: string[];
      clientQuote?: Types.ObjectId;
      timeline?: string;
      customSections?: {
        _id?: Types.ObjectId;
        heading: string;
        body?: unknown;
        image?: FileLean | null;
      }[];
      seoTitle?: string;
      seoDescription?: string;
      state: ContentState;
      featured: boolean;
      position: number;
      publishedAt?: Date;
      updatedAt?: Date;
    }>();
  if (!p) return null;

  const [order, testimonials] = await Promise.all([
    Project.find()
      .sort({ featured: -1, position: 1 })
      .select("_id")
      .lean<{ _id: Types.ObjectId }[]>(),
    testimonialOptions(),
  ]);

  const form: ProjectForm = {
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    client: p.client ?? "",
    year: p.year ? String(p.year) : "",
    type: p.type ?? "",
    status: p.status ?? "",
    summary: p.summary ?? "",
    cover: toImageView(p.coverImage),
    stack: p.stack ?? [],
    problemHeading: p.headings?.problem ?? "",
    problem: p.problem ?? "",
    bodyHeading: p.headings?.body ?? "",
    body: storedDoc(p.body),
    constraintsHeading: p.headings?.constraints ?? "",
    constraints: storedDoc(p.constraints),
    decisions: (p.decisions ?? []).map((d) => ({
      key: newKey(),
      decision: d.decision,
      reason: d.reason ?? "",
    })),
    outcomeHeading: p.headings?.outcome ?? "",
    outcome: storedDoc(p.outcome),
    gallery: (p.gallery ?? []).flatMap((g) => {
      const image = toImageView(g.file);
      return image ? [{ key: newKey(), image, caption: g.caption ?? "" }] : [];
    }),
    liveUrl: p.liveUrl ?? "",
    repoUrl: p.repoUrl ?? "",
    role: p.role ?? "",
    team: (p.team ?? []).join("\n"),
    clientQuoteId: p.clientQuote ? String(p.clientQuote) : "",
    timeline: p.timeline ?? "",
    customSections: (p.customSections ?? []).map((s) => ({
      key: newKey(),
      id: s._id ? String(s._id) : null,
      heading: s.heading,
      body: storedDoc(s.body),
      image: toImageView(s.image),
    })),
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    featured: p.featured,
  };

  return {
    form,
    meta: {
      state: p.state,
      slug: p.slug,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null,
      position: order.findIndex((o) => String(o._id) === String(p._id)) + 1,
      total: order.length,
    },
    testimonials,
  };
}

/* ------------------------------------------------------------ validation */

export type FieldErrors = Record<string, string>;

export type SaveResult =
  | { ok: true; id: string; meta: ProjectMeta; notice?: string }
  | {
      ok: false;
      errors: FieldErrors;
      /** Set when the content was saved but the state change was refused. */
      saved?: { id: string; meta: ProjectMeta };
      message: string;
    };

class InputError extends Error {
  constructor(public errors: FieldErrors) {
    super("The project could not be saved.");
  }
}

const INTENTS: readonly SaveIntent[] = [
  "save",
  "publish",
  "unpublish",
  "archive",
  "restore",
];

function text(
  value: unknown,
  field: string,
  errors: FieldErrors,
  { max, required, label }: { max: number; required?: string; label: string },
): string {
  const s =
    typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim() : "";
  if (value !== undefined && value !== null && typeof value !== "string") {
    errors[field] = `${label} must be text.`;
  } else if (required && !s) {
    errors[field] = required;
  } else if (s.length > max) {
    errors[field] = `${label} can be at most ${max} characters.`;
  }
  return s;
}

function url(
  value: unknown,
  field: string,
  errors: FieldErrors,
  label: string,
): string {
  const s = text(value, field, errors, { max: 500, label });
  if (s && !/^https?:\/\/[^\s/$.?#][^\s]*$/i.test(s)) {
    errors[field] =
      `${label} must be a full address starting with http:// or https://.`;
  }
  return s;
}

function doc(value: unknown, field: string, errors: FieldErrors) {
  try {
    return sanitizeDoc(value);
  } catch {
    errors[field] =
      `That text is too long to save (over ${Math.round(MAX_DOC_BYTES / 1000)}KB).`;
    return null;
  }
}

function list<T>(
  value: unknown,
  field: string,
  errors: FieldErrors,
  max: number,
  label: string,
): T[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors[field] = `${label} is not a list.`;
    return [];
  }
  if (value.length > max) {
    errors[field] = `${label} can have at most ${max} entries.`;
    return [];
  }
  return value as T[];
}

type CleanProject = Omit<
  ProjectPayload,
  "coverId" | "gallery" | "customSections" | "clientQuoteId" | "alts"
> & {
  coverImage: Types.ObjectId | null;
  gallery: { file: Types.ObjectId; caption: string }[];
  customSections: {
    _id?: Types.ObjectId;
    heading: string;
    body: unknown;
    image: Types.ObjectId | null;
  }[];
  clientQuote: Types.ObjectId | null;
  alts: { id: Types.ObjectId; alt: string }[];
};

/** Check every field of an untrusted payload. Throws InputError listing each problem. */
async function cleanPayload(raw: unknown): Promise<CleanProject> {
  const errors: FieldErrors = {};
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;

  const intent = INTENTS.includes(p.intent as SaveIntent)
    ? (p.intent as SaveIntent)
    : "save";
  const id =
    p.id === null || p.id === undefined
      ? null
      : isObjectId(p.id)
        ? p.id
        : undefined;
  if (id === undefined) errors.id = "That project could not be found.";

  const title = text(p.title, "title", errors, {
    max: PROJECT_TITLE_MAX,
    required: "Give the project a title.",
    label: "The title",
  });

  let slug = text(p.slug, "slug", errors, { max: 80, label: "The slug" });
  if (slug) {
    slug = slugify(slug);
    if (!isSlug(slug))
      errors.slug =
        "The slug can only use lowercase letters, numbers and hyphens.";
  }

  let year: number | null = null;
  if (p.year !== null && p.year !== undefined && p.year !== "") {
    const n = Number(p.year);
    if (!Number.isInteger(n) || n < 2000 || n > 2100)
      errors.year = "The year must be between 2000 and 2100.";
    else year = n;
  }

  const type = typeof p.type === "string" ? p.type : "";
  if (type && !PROJECT_TYPES.includes(type as ProjectType))
    errors.type = "Choose one of the project types.";
  const status = typeof p.status === "string" ? p.status : "";
  if (status && !PROJECT_STATUSES.includes(status as ProjectStatusValue)) {
    errors.status = "Choose one of the project statuses.";
  }

  const summary = text(p.summary, "summary", errors, {
    max: PROJECT_SUMMARY_MAX,
    label: "The summary",
  });
  const problem = text(p.problem, "problem", errors, {
    max: 5000,
    label: "The problem",
  });

  const h = (
    p.headings && typeof p.headings === "object" ? p.headings : {}
  ) as Record<string, unknown>;
  const headings = {
    problem: text(h.problem, "problemHeading", errors, {
      max: 140,
      label: "The heading",
    }),
    constraints: text(h.constraints, "constraintsHeading", errors, {
      max: 140,
      label: "The heading",
    }),
    body: text(h.body, "bodyHeading", errors, {
      max: 140,
      label: "The heading",
    }),
    outcome: text(h.outcome, "outcomeHeading", errors, {
      max: 140,
      label: "The heading",
    }),
  };

  const stack: string[] = [];
  for (const tag of list<unknown>(p.stack, "stack", errors, 20, "Stack")) {
    const t = typeof tag === "string" ? tag.trim() : "";
    if (!t) continue;
    if (t.length > 40) {
      errors.stack = "Each stack tag can be at most 40 characters.";
      continue;
    }
    if (!stack.some((s) => s.toLowerCase() === t.toLowerCase())) stack.push(t);
  }

  const decisions = list<Record<string, unknown>>(
    p.decisions,
    "decisions",
    errors,
    20,
    "Key decisions",
  )
    .map((d, i) => ({
      decision: text(d?.decision, `decisions.${i}.decision`, errors, {
        max: 200,
        label: "A decision",
      }),
      reason: text(d?.reason, `decisions.${i}.reason`, errors, {
        max: 1000,
        label: "The reason",
      }),
    }))
    .filter((d, i) => {
      if (!d.decision && d.reason)
        errors[`decisions.${i}.decision`] =
          "Write the decision itself, not only the reason.";
      return d.decision || d.reason;
    });

  const galleryIn = list<Record<string, unknown>>(
    p.gallery,
    "gallery",
    errors,
    24,
    "The gallery",
  );
  const sectionsIn = list<Record<string, unknown>>(
    p.customSections,
    "customSections",
    errors,
    20,
    "Custom sections",
  );
  const altsIn = list<Record<string, unknown>>(
    p.alts,
    "alts",
    errors,
    60,
    "Alt text",
  );

  const coverId =
    p.coverId === null || p.coverId === undefined || p.coverId === ""
      ? null
      : p.coverId;
  if (coverId !== null && !isObjectId(coverId))
    errors.coverImage = "That cover image could not be found.";

  const gallery = galleryIn.map((g, i) => {
    if (!isObjectId(g?.fileId))
      errors[`gallery.${i}`] = "That image could not be found.";
    return {
      fileId: g?.fileId as string,
      caption: text(g?.caption, `gallery.${i}.caption`, errors, {
        max: 200,
        label: "The caption",
      }),
    };
  });

  const customSections = sectionsIn.map((s, i) => {
    const heading = text(s?.heading, `customSections.${i}.heading`, errors, {
      max: 140,
      label: "The heading",
    });
    const body = doc(s?.body, `customSections.${i}.body`, errors);
    const imageId =
      s?.imageId === null || s?.imageId === undefined || s?.imageId === ""
        ? null
        : s.imageId;
    if (imageId !== null && !isObjectId(imageId))
      errors[`customSections.${i}.image`] = "That image could not be found.";
    if (!heading && (body || imageId))
      errors[`customSections.${i}.heading`] = "Give this section a heading.";
    const sectionId = isObjectId(s?.id) ? s.id : null;
    return { sectionId, heading, body, imageId: imageId as string | null };
  });

  const clientQuoteId =
    p.clientQuoteId === null ||
    p.clientQuoteId === undefined ||
    p.clientQuoteId === ""
      ? null
      : p.clientQuoteId;
  if (clientQuoteId !== null && !isObjectId(clientQuoteId))
    errors.clientQuote = "That testimonial could not be found.";

  const alts = altsIn.map((a, i) => {
    if (!isObjectId(a?.id))
      errors[`alts.${i}`] = "That image could not be found.";
    return {
      id: a?.id as string,
      alt: text(a?.alt, `alts.${i}`, errors, { max: 300, label: "Alt text" }),
    };
  });

  const body = doc(p.body, "body", errors);
  const constraints = doc(p.constraints, "constraints", errors);
  const outcome = doc(p.outcome, "outcome", errors);

  const result = {
    id: id ?? null,
    intent,
    title,
    slug,
    client: text(p.client, "client", errors, { max: 140, label: "The client" }),
    year,
    type,
    status,
    summary,
    stack,
    headings,
    problem,
    body,
    constraints,
    decisions,
    outcome,
    liveUrl: url(p.liveUrl, "liveUrl", errors, "The live URL"),
    repoUrl: url(p.repoUrl, "repoUrl", errors, "The repository URL"),
    role: text(p.role, "role", errors, { max: 140, label: "The role" }),
    team: list<unknown>(p.team, "team", errors, 20, "The team")
      .map((m, i) =>
        text(m, `team.${i}`, errors, { max: 140, label: "A team entry" }),
      )
      .filter(Boolean),
    timeline: text(p.timeline, "timeline", errors, {
      max: 140,
      label: "The timeline",
    }),
    seoTitle: text(p.seoTitle, "seoTitle", errors, {
      max: PROJECT_SEO_TITLE_MAX,
      label: "The SEO title",
    }),
    seoDescription: text(p.seoDescription, "seoDescription", errors, {
      max: PROJECT_SEO_DESCRIPTION_MAX,
      label: "The SEO description",
    }),
    featured: p.featured === true,
  };

  if (Object.keys(errors).length > 0) throw new InputError(errors);

  /* ---- every referenced image must be a stored image ---- */
  const fileIds = [
    ...new Set([
      ...(coverId ? [coverId as string] : []),
      ...gallery.map((g) => g.fileId),
      ...customSections.flatMap((s) => (s.imageId ? [s.imageId] : [])),
    ]),
  ];
  if (fileIds.length > 0) {
    const found = await StoredFile.find({
      _id: { $in: fileIds },
      mimeType: /^image\//,
    })
      .select("_id")
      .lean<{ _id: Types.ObjectId }[]>();
    const known = new Set(found.map((f) => String(f._id)));
    if (coverId && !known.has(coverId as string))
      errors.coverImage = "That cover image could not be found.";
    gallery.forEach((g, i) => {
      if (!known.has(g.fileId))
        errors[`gallery.${i}`] = "That image could not be found.";
    });
    customSections.forEach((s, i) => {
      if (s.imageId && !known.has(s.imageId))
        errors[`customSections.${i}.image`] = "That image could not be found.";
    });
  }
  if (clientQuoteId && !(await Testimonial.exists({ _id: clientQuoteId }))) {
    errors.clientQuote = "That testimonial could not be found.";
  }
  if (Object.keys(errors).length > 0) throw new InputError(errors);

  const oid = (s: string) => new mongoose.Types.ObjectId(s);
  return {
    ...result,
    coverImage: coverId ? oid(coverId as string) : null,
    gallery: gallery.map((g) => ({ file: oid(g.fileId), caption: g.caption })),
    customSections: customSections.map((s) => ({
      ...(s.sectionId ? { _id: oid(s.sectionId) } : {}),
      heading: s.heading,
      body: s.body,
      image: s.imageId ? oid(s.imageId) : null,
    })),
    clientQuote: clientQuoteId ? oid(clientQuoteId as string) : null,
    alts: alts
      .filter((a) => fileIds.includes(a.id))
      .map((a) => ({ id: oid(a.id), alt: a.alt })),
  };
}

/* ------------------------------------------------------------------ save */

const TARGET_STATE: Record<SaveIntent, ContentState | null> = {
  save: null,
  publish: "published",
  unpublish: "draft",
  archive: "archived",
  restore: "draft",
};

/** The model's rule messages, keyed by field. */
function ruleErrors(error: unknown): FieldErrors | null {
  if (
    error instanceof RuleViolation ||
    error instanceof mongoose.Error.ValidationError
  ) {
    return Object.fromEntries(
      Object.entries(error.errors).map(([path, e]) => [path, e.message]),
    );
  }
  return null;
}

function revalidateProject(...slugs: (string | null | undefined)[]) {
  revalidatePath("/");
  revalidatePath("/projects");
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/projects/${slug}`);
  }
  revalidatePath("/admin/projects");
  revalidatePath("/admin");
}

async function metaFor(id: Types.ObjectId): Promise<ProjectMeta> {
  const [p, order] = await Promise.all([
    Project.findById(id).select("state slug publishedAt updatedAt").lean<{
      state: ContentState;
      slug: string;
      publishedAt?: Date;
      updatedAt?: Date;
    }>(),
    Project.find()
      .sort({ featured: -1, position: 1 })
      .select("_id")
      .lean<{ _id: Types.ObjectId }[]>(),
  ]);
  return {
    state: p?.state ?? "draft",
    slug: p?.slug ?? "",
    publishedAt: p?.publishedAt ? p.publishedAt.toISOString() : null,
    updatedAt: p?.updatedAt ? p.updatedAt.toISOString() : null,
    position: order.findIndex((o) => String(o._id) === String(id)) + 1,
    total: order.length,
  };
}

export async function saveProject(raw: unknown): Promise<SaveResult> {
  await requireAdmin();
  await dbConnect();

  let input: CleanProject;
  try {
    input = await cleanPayload(raw);
  } catch (error) {
    if (error instanceof InputError) {
      return {
        ok: false,
        errors: error.errors,
        message: "Some fields need attention before this can be saved.",
      };
    }
    throw error;
  }

  const existing = input.id ? await Project.findById(input.id) : null;
  if (input.id && !existing) {
    return {
      ok: false,
      errors: { id: "This project no longer exists." },
      message: "This project no longer exists.",
    };
  }
  const project = existing ?? new Project();
  const previousState = (existing?.state ?? "draft") as ContentState;
  const previousSlug = existing?.slug ?? null;

  project.set({
    title: input.title,
    client: input.client || undefined,
    year: input.year ?? undefined,
    type: input.type || undefined,
    status: input.status || undefined,
    summary: input.summary || undefined,
    coverImage: input.coverImage ?? undefined,
    stack: input.stack,
    headings: input.headings,
    problem: input.problem || undefined,
    body: input.body ?? undefined,
    constraints: input.constraints ?? undefined,
    decisions: input.decisions.map((d) => ({
      decision: d.decision,
      reason: d.reason || undefined,
    })),
    outcome: input.outcome ?? undefined,
    gallery: input.gallery.map((g) => ({
      file: g.file,
      caption: g.caption || undefined,
    })),
    liveUrl: input.liveUrl || undefined,
    repoUrl: input.repoUrl || undefined,
    role: input.role || undefined,
    team: input.team,
    clientQuote: input.clientQuote ?? undefined,
    timeline: input.timeline || undefined,
    customSections: input.customSections.map((s) => ({
      ...s,
      body: s.body ?? undefined,
      image: s.image ?? undefined,
    })),
    seoTitle: input.seoTitle || undefined,
    seoDescription: input.seoDescription || undefined,
  });
  /* A slug left empty is generated from the title; one typed is kept. */
  if (input.slug) project.slug = input.slug;
  else if (!existing) project.slug = "";

  const target = TARGET_STATE[input.intent] ?? previousState;
  project.state = target;
  /* Featured only means something for a published project; the model refuses
     it otherwise, and takes it off when a project is unpublished. */
  if (target === "published") project.featured = input.featured;
  else if (target !== previousState) project.featured = false;
  else if (input.featured) project.featured = true;

  const altUpdates = async () => {
    for (const a of input.alts) {
      await StoredFile.updateOne(
        { _id: a.id },
        { $set: { alt: a.alt || undefined } },
      );
    }
  };

  try {
    await project.save();
  } catch (error) {
    const errors = ruleErrors(error);
    if (!errors) throw error;

    /* Publishing a draft that is not ready: keep the writing, report what is
       missing. docs/04-ADMIN.md — "Publish is blocked with a clear message". */
    const publishBlocked =
      input.intent === "publish" &&
      previousState !== "published" &&
      !errors.slug &&
      !errors.title;
    if (publishBlocked) {
      project.state = previousState;
      project.featured = false;
      try {
        await project.save();
        await altUpdates();
        revalidateProject(previousSlug, project.slug);
        return {
          ok: false,
          errors,
          saved: { id: String(project._id), meta: await metaFor(project._id) },
          message:
            "Saved as a draft. It cannot be published until these are done:",
        };
      } catch (retry) {
        const retryErrors = ruleErrors(retry);
        if (!retryErrors) throw retry;
        return {
          ok: false,
          errors: { ...errors, ...retryErrors },
          message: "The project could not be saved.",
        };
      }
    }

    const message =
      target === "published"
        ? "A published project needs every required field. Nothing was saved:"
        : errors.featured
          ? errors.featured
          : "The project could not be saved:";
    return { ok: false, errors, message };
  }

  await altUpdates();
  revalidateProject(previousSlug, project.slug);

  const notice =
    input.intent === "publish"
      ? "Published."
      : input.intent === "unpublish"
        ? "Unpublished. It is a draft again."
        : input.intent === "archive"
          ? "Archived."
          : input.intent === "restore"
            ? "Restored as a draft."
            : undefined;

  return {
    ok: true,
    id: String(project._id),
    meta: await metaFor(project._id),
    notice,
  };
}

/* ------------------------------------------------------- list operations */

export type ListResult = { ok: true } | { ok: false; error: string };

/** Save the manual order: `ids` is every project, top to bottom. */
export async function reorderProjects(ids: unknown): Promise<ListResult> {
  await requireAdmin();
  await dbConnect();

  if (
    !Array.isArray(ids) ||
    !ids.every(isObjectId) ||
    new Set(ids).size !== ids.length
  ) {
    return {
      ok: false,
      error: "That order could not be read. Reload the page and try again.",
    };
  }
  const all = await Project.find()
    .select("_id")
    .lean<{ _id: Types.ObjectId }[]>();
  const known = new Set(all.map((p) => String(p._id)));
  if (all.length !== ids.length || !ids.every((id) => known.has(id))) {
    return {
      ok: false,
      error:
        "The list changed since this page loaded. Reload it and try again.",
    };
  }

  await Project.bulkWrite(
    ids.map((id, position) => ({
      updateOne: { filter: { _id: id }, update: { $set: { position } } },
    })),
  );
  revalidateProject();
  const slugs = await Project.find({ state: "published" })
    .select("slug")
    .lean<{ slug: string }[]>();
  slugs.forEach((s) => revalidatePath(`/projects/${s.slug}`));
  return { ok: true };
}

export async function setProjectFeatured(
  id: unknown,
  featured: unknown,
): Promise<ListResult> {
  await requireAdmin();
  await dbConnect();

  if (!isObjectId(id) || typeof featured !== "boolean") {
    return { ok: false, error: "That change could not be read." };
  }
  const project = await Project.findById(id);
  if (!project) return { ok: false, error: "That project no longer exists." };

  project.featured = featured;
  try {
    await project.save();
  } catch (error) {
    const errors = ruleErrors(error);
    if (!errors) throw error;
    return {
      ok: false,
      error: Object.values(errors)[0] ?? "That could not be changed.",
    };
  }
  revalidateProject(project.slug);
  const slugs = await Project.find({ state: "published" })
    .select("slug")
    .lean<{ slug: string }[]>();
  slugs.forEach((s) => revalidatePath(`/projects/${s.slug}`));
  return { ok: true };
}

export { MAX_FEATURED_PROJECTS };
