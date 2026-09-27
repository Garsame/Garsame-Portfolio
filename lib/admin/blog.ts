import "server-only";

import mongoose, { type Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { dbConnect } from "@/lib/db";
import { isEditorDoc } from "@/lib/editor-content";
import { MAX_DOC_BYTES, sanitizeDoc } from "@/lib/editor-schema";
import type { BlogForm, BlogMeta } from "@/lib/blog-form";
import { emptyBlogForm } from "@/lib/blog-form";
import {
  POST_CATEGORIES,
  POST_EXCERPT_MAX,
  POST_SEO_DESCRIPTION_MAX,
  POST_SEO_TITLE_MAX,
  POST_TITLE_MAX,
  type PostCategory,
} from "@/lib/blog-rules";
import { getTemplate } from "@/lib/blog-templates";
import type { ImageView } from "@/lib/project-view";
import { toImageView } from "@/lib/projects";
import { isSlug, slugify } from "@/lib/slug";
import type { ContentState, SaveIntent } from "@/lib/project-form";
import { Post, RuleViolation, StoredFile, type IFile, type IPost } from "@/models";

const FILE_FIELDS = "url width height alt originalName mimeType";

type FileLean = Pick<
  IFile,
  "url" | "width" | "height" | "alt" | "originalName" | "mimeType"
> & { _id: Types.ObjectId };

export type AdminPostRow = {
  id: string;
  slug: string;
  title: string;
  category: PostCategory;
  state: ContentState;
  featured: boolean;
  publishedAt: string | null;
  scheduledFor: string | null;
  updatedAt: string;
  views: number;
  readingTime: number;
  cover: ImageView | null;
};

const isObjectId = (v: unknown): v is string =>
  typeof v === "string" &&
  mongoose.isValidObjectId(v) &&
  /^[0-9a-f]{24}$/i.test(v);

export type PostCounts = {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  archived: number;
};

/** List posts for the admin table with search and status filtering. */
export async function listAdminPosts(filter?: {
  status?: string;
  search?: string;
}): Promise<{ posts: AdminPostRow[]; counts: PostCounts }> {
  await requireAdmin();
  await dbConnect();

  const query: Record<string, unknown> = {};

  if (filter?.status === "published") {
    query.state = "published";
  } else if (filter?.status === "draft") {
    query.state = "draft";
    query.scheduledFor = { $exists: false };
  } else if (filter?.status === "scheduled") {
    query.state = "draft";
    query.scheduledFor = { $exists: true, $ne: null };
  } else if (filter?.status === "archived") {
    query.state = "archived";
  }

  if (filter?.search) {
    const term = filter.search.trim();
    query.$or = [
      { title: { $regex: term, $options: "i" } },
      { slug: { $regex: term, $options: "i" } },
      { excerpt: { $regex: term, $options: "i" } },
      { category: { $regex: term, $options: "i" } },
    ];
  }

  const [posts, allPosts] = await Promise.all([
    Post.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("coverImage", FILE_FIELDS)
      .lean<
        (Omit<IPost, "coverImage"> & {
          _id: Types.ObjectId;
          coverImage?: FileLean | null;
        })[]
      >(),
    Post.find().select("state scheduledFor").lean<{ state: string; scheduledFor?: Date }[]>(),
  ]);

  const counts: PostCounts = {
    total: allPosts.length,
    published: allPosts.filter((p) => p.state === "published").length,
    draft: allPosts.filter((p) => p.state === "draft" && !p.scheduledFor).length,
    scheduled: allPosts.filter((p) => p.state === "draft" && Boolean(p.scheduledFor)).length,
    archived: allPosts.filter((p) => p.state === "archived").length,
  };

  const rows: AdminPostRow[] = posts.map((p) => ({
    id: String(p._id),
    slug: p.slug,
    title: p.title,
    category: (p.category ?? "technology") as PostCategory,
    state: p.state as ContentState,
    featured: p.featured ?? false,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    scheduledFor: p.scheduledFor ? p.scheduledFor.toISOString() : null,
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : p.createdAt.toISOString(),
    views: p.views ?? 0,
    readingTime: p.readingTime ?? 5,
    cover: toImageView(p.coverImage),
  }));

  return { posts: rows, counts };
}

export type PostEditorData = {
  form: BlogForm;
  meta: BlogMeta;
};

export async function getNewPostData(templateKey?: string): Promise<PostEditorData> {
  await requireAdmin();
  await dbConnect();

  const template = getTemplate(templateKey);
  const form = emptyBlogForm(template.doc, template.defaultCategory);

  return {
    form,
    meta: {
      state: "draft",
      slug: "",
      publishedAt: null,
      scheduledFor: null,
      updatedAt: null,
      views: 0,
      readingTime: 1,
      tocCount: 0,
    },
  };
}

export async function getPostEditorData(id: string): Promise<PostEditorData | null> {
  await requireAdmin();
  if (!isObjectId(id)) return null;
  await dbConnect();

  const post = await Post.findById(id)
    .populate("coverImage", FILE_FIELDS)
    .lean<
      (Omit<IPost, "coverImage"> & {
        _id: Types.ObjectId;
        coverImage?: FileLean | null;
      }) | null
    >();

  if (!post) return null;

  const form: BlogForm = {
    id: String(post._id),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    cover: toImageView(post.coverImage),
    category: (post.category ?? "technology") as PostCategory,
    tags: post.tags ?? [],
    body: isEditorDoc(post.body) ? post.body : null,
    featured: post.featured ?? false,
    series: post.series ?? "",
    scheduledFor: post.scheduledFor ? post.scheduledFor.toISOString() : "",
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
  };

  return {
    form,
    meta: {
      state: post.state as ContentState,
      slug: post.slug,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      scheduledFor: post.scheduledFor ? post.scheduledFor.toISOString() : null,
      updatedAt: post.updatedAt ? post.updatedAt.toISOString() : null,
      views: post.views ?? 0,
      readingTime: post.readingTime ?? 1,
      tocCount: post.toc?.length ?? 0,
    },
  };
}

export type FieldErrors = Record<string, string>;

export type SavePostResult =
  | { ok: true; id: string; meta: BlogMeta; notice?: string }
  | {
      ok: false;
      errors: FieldErrors;
      saved?: { id: string; meta: BlogMeta };
      message: string;
    };

class InputError extends Error {
  constructor(public errors: FieldErrors) {
    super("The post could not be saved.");
  }
}

function text(
  value: unknown,
  field: string,
  errors: FieldErrors,
  { max, required, label }: { max: number; required?: string; label: string },
): string {
  const s = typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim() : "";
  if (value !== undefined && value !== null && typeof value !== "string") {
    errors[field] = `${label} must be text.`;
  } else if (required && !s) {
    errors[field] = required;
  } else if (s.length > max) {
    errors[field] = `${label} can be at most ${max} characters.`;
  }
  return s;
}

function doc(value: unknown, field: string, errors: FieldErrors) {
  try {
    return sanitizeDoc(value);
  } catch {
    errors[field] = `That text is too long to save (over ${Math.round(MAX_DOC_BYTES / 1000)}KB).`;
    return null;
  }
}

/** Recursively collect all file IDs embedded in the TipTap body */
function extractBodyImageIds(node: unknown, ids: Set<string>) {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  if (n.type === "image" && n.attrs && typeof n.attrs === "object") {
    const fileId = (n.attrs as Record<string, unknown>).fileId;
    if (typeof fileId === "string" && isObjectId(fileId)) {
      ids.add(fileId);
    }
  }
  if (Array.isArray(n.content)) {
    n.content.forEach((child) => extractBodyImageIds(child, ids));
  }
}

async function cleanPostPayload(raw: unknown) {
  const errors: FieldErrors = {};
  const p = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const intent = (p.intent as SaveIntent) || "save";
  const id = p.id === null || p.id === undefined ? null : isObjectId(p.id) ? p.id : undefined;
  if (id === undefined) errors.id = "That post could not be found.";

  const title = text(p.title, "title", errors, {
    max: POST_TITLE_MAX,
    required: "Give the post a title.",
    label: "The title",
  });

  let slug = text(p.slug, "slug", errors, { max: 80, label: "The slug" });
  if (slug) {
    slug = slugify(slug);
    if (!isSlug(slug)) errors.slug = "The slug can only use lowercase letters, numbers and hyphens.";
  }

  const excerpt = text(p.excerpt, "excerpt", errors, {
    max: POST_EXCERPT_MAX,
    label: "The excerpt",
  });

  const category = typeof p.category === "string" ? p.category : "";
  if (category && !POST_CATEGORIES.includes(category as PostCategory)) {
    errors.category = "Choose one of the categories.";
  }

  const coverId =
    p.coverId === null || p.coverId === undefined || p.coverId === "" ? null : p.coverId;
  if (coverId !== null && !isObjectId(coverId)) {
    errors.coverImage = "That cover image could not be found.";
  }

  let scheduledFor: Date | null = null;
  if (p.scheduledFor && typeof p.scheduledFor === "string") {
    const d = new Date(p.scheduledFor);
    if (isNaN(d.getTime())) {
      errors.scheduledFor = "Invalid date format.";
    } else if (d.getTime() <= Date.now() && intent === "save" && p.scheduledFor) {
      errors.scheduledFor = "Schedule date must be in the future.";
    } else {
      scheduledFor = d;
    }
  }

  const body = doc(p.body, "body", errors);

  if (Object.keys(errors).length > 0) throw new InputError(errors);

  const oid = (s: string) => new mongoose.Types.ObjectId(s);

  return {
    id: id ?? null,
    intent,
    title,
    slug,
    excerpt,
    category: (category || undefined) as PostCategory | undefined,
    coverImage: coverId ? oid(coverId as string) : null,
    tags: Array.isArray(p.tags) ? p.tags.filter((t) => typeof t === "string" && t.trim()) : [],
    body,
    featured: p.featured === true,
    series: text(p.series, "series", errors, { max: 80, label: "The series" }),
    scheduledFor,
    seoTitle: text(p.seoTitle, "seoTitle", errors, {
      max: POST_SEO_TITLE_MAX,
      label: "The SEO title",
    }),
    seoDescription: text(p.seoDescription, "seoDescription", errors, {
      max: POST_SEO_DESCRIPTION_MAX,
      label: "The SEO description",
    }),
  };
}

const TARGET_STATE: Record<SaveIntent, ContentState | null> = {
  save: null,
  publish: "published",
  unpublish: "draft",
  archive: "archived",
  restore: "draft",
};

function ruleErrors(error: unknown): FieldErrors | null {
  if (error instanceof RuleViolation || error instanceof mongoose.Error.ValidationError) {
    return Object.fromEntries(
      Object.entries(error.errors).map(([path, e]) => [path, e.message]),
    );
  }
  return null;
}

function revalidateBlog(...slugs: (string | null | undefined)[]) {
  revalidatePath("/");
  revalidatePath("/blog");
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/blog/${slug}`);
  }
  revalidatePath("/admin/blog");
  revalidatePath("/admin");
}

async function metaFor(id: Types.ObjectId): Promise<BlogMeta> {
  const post = await Post.findById(id).select("state slug publishedAt scheduledFor updatedAt views readingTime toc").lean<IPost>();
  return {
    state: (post?.state ?? "draft") as ContentState,
    slug: post?.slug ?? "",
    publishedAt: post?.publishedAt ? post.publishedAt.toISOString() : null,
    scheduledFor: post?.scheduledFor ? post.scheduledFor.toISOString() : null,
    updatedAt: post?.updatedAt ? post.updatedAt.toISOString() : null,
    views: post?.views ?? 0,
    readingTime: post?.readingTime ?? 1,
    tocCount: post?.toc?.length ?? 0,
  };
}

export async function savePost(raw: unknown): Promise<SavePostResult> {
  await requireAdmin();
  await dbConnect();

  let input: Awaited<ReturnType<typeof cleanPostPayload>>;
  try {
    input = await cleanPostPayload(raw);
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

  const existing = input.id ? await Post.findById(input.id) : null;
  if (input.id && !existing) {
    return {
      ok: false,
      errors: { id: "This post no longer exists." },
      message: "This post no longer exists.",
    };
  }

  const post = existing ?? new Post();
  const previousState = (existing?.state ?? "draft") as ContentState;
  const previousSlug = existing?.slug ?? null;

  post.set({
    title: input.title,
    excerpt: input.excerpt || undefined,
    coverImage: input.coverImage ?? undefined,
    category: input.category,
    tags: input.tags,
    body: input.body ?? undefined,
    series: input.series || undefined,
    seoTitle: input.seoTitle || undefined,
    seoDescription: input.seoDescription || undefined,
    featured: input.featured,
  });

  if (input.slug) post.slug = input.slug;
  else if (!existing) post.slug = "";

  if (input.scheduledFor) {
    post.scheduledFor = input.scheduledFor;
  } else if (input.scheduledFor === null && existing?.scheduledFor) {
    post.scheduledFor = undefined;
  }

  const target = TARGET_STATE[input.intent] ?? previousState;
  post.state = target;

  try {
    await post.save();
  } catch (error) {
    const errors = ruleErrors(error);
    if (!errors) throw error;

    if (input.intent === "publish" || input.intent === "save" && input.scheduledFor) {
      post.state = "draft";
      try {
        await post.save();
        const meta = await metaFor(post._id as Types.ObjectId);
        return {
          ok: false,
          errors,
          saved: { id: String(post._id), meta },
          message: "Saved as a draft. It cannot be published until these are done:",
        };
      } catch {
        // Fall through
      }
    }

    return {
      ok: false,
      errors,
      message: "Some fields need attention before this can be saved.",
    };
  }

  // Update file usage in StoredFile
  const usedFileIds = new Set<string>();
  if (post.coverImage) usedFileIds.add(String(post.coverImage));
  extractBodyImageIds(post.body, usedFileIds);

  const postId = post._id as Types.ObjectId;
  const currentOids = Array.from(usedFileIds).map((id) => new mongoose.Types.ObjectId(id));

  await Promise.all([
    StoredFile.updateMany(
      { "usedBy.id": postId, _id: { $nin: currentOids } },
      { $pull: { usedBy: { id: postId } } },
    ),
    StoredFile.updateMany(
      { _id: { $in: currentOids }, "usedBy.id": { $ne: postId } },
      { $addToSet: { usedBy: { model: "Post", id: postId } } },
    ),
  ]);

  const meta = await metaFor(postId);
  revalidateBlog(previousSlug, post.slug);

  const notice =
    input.intent === "publish"
      ? "Post published."
      : input.intent === "archive"
        ? "Post archived."
        : input.intent === "unpublish"
          ? "Post moved to draft."
          : input.scheduledFor
            ? "Post scheduled."
            : undefined;

  return { ok: true, id: String(postId), meta, notice };
}

export async function deletePost(id: string): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  if (!isObjectId(id)) return { ok: false, message: "Invalid post ID." };
  await dbConnect();

  const post = await Post.findById(id);
  if (!post) return { ok: false, message: "Post not found." };

  const postId = post._id as Types.ObjectId;
  const slug = post.slug;

  await Promise.all([
    StoredFile.updateMany(
      { "usedBy.id": postId },
      { $pull: { usedBy: { id: postId } } },
    ),
    Post.findByIdAndDelete(postId),
  ]);

  revalidateBlog(slug);
  return { ok: true };
}
