import "server-only";

import { cache } from "react";
import type { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import type { EditorNode, TocEntry } from "@/lib/editor-content";
import { isEditorDoc } from "@/lib/editor-content";
import type { PostCategory } from "@/lib/blog-rules";
import { POST_CATEGORIES } from "@/lib/blog-rules";
import type { ImageView } from "@/lib/project-view";
import { toImageView } from "@/lib/projects";
import { Post, type IFile, type IPost } from "@/models";

type FileLean = Pick<
  IFile,
  "url" | "width" | "height" | "alt" | "originalName" | "mimeType"
> & { _id: Types.ObjectId };

const FILE_FIELDS = "url width height alt originalName mimeType";

export type BlogPostSummaryView = {
  id: string;
  slug: string;
  number: number;
  title: string;
  excerpt: string;
  cover: ImageView | null;
  category: PostCategory;
  publishedAt: string;
  readingTime: number;
  featured: boolean;
};

export type BlogPostDetailView = {
  id: string;
  slug: string;
  number: number;
  title: string;
  excerpt: string;
  cover: ImageView | null;
  category: PostCategory;
  tags: string[];
  body: EditorNode | null;
  publishedAt: string;
  readingTime: number;
  toc: TocEntry[];
  views: number;
  series?: string;
  seoTitle?: string;
  seoDescription?: string;
};

/** Get published posts matching category (or all if omitted), newest first. */
export const getPublishedPosts = cache(
  async (category?: string): Promise<BlogPostSummaryView[]> => {
    await dbConnect();

    const query: Record<string, unknown> = { state: "published" };
    if (category && POST_CATEGORIES.includes(category as PostCategory)) {
      query.category = category;
    }

    const posts = await Post.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("coverImage", FILE_FIELDS)
      .lean<
        (Omit<IPost, "coverImage"> & {
          _id: Types.ObjectId;
          coverImage?: FileLean | null;
        })[]
      >();

    const totalCount = posts.length;

    return posts.map((p, idx) => ({
      id: String(p._id),
      slug: p.slug,
      number: totalCount - idx,
      title: p.title,
      excerpt: p.excerpt ?? "",
      cover: toImageView(p.coverImage),
      category: (p.category ?? "technology") as PostCategory,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : p.createdAt.toISOString(),
      readingTime: p.readingTime ?? 5,
      featured: p.featured ?? false,
    }));
  },
);

/** Get featured post if any, or the latest published post. */
export const getFeaturedPost = cache(
  async (): Promise<BlogPostSummaryView | null> => {
    await dbConnect();
    const featured = await Post.findOne({ state: "published", featured: true })
      .populate("coverImage", FILE_FIELDS)
      .lean<
        (Omit<IPost, "coverImage"> & {
          _id: Types.ObjectId;
          coverImage?: FileLean | null;
        }) | null
      >();

    if (featured) {
      return {
        id: String(featured._id),
        slug: featured.slug,
        number: 12, // display number
        title: featured.title,
        excerpt: featured.excerpt ?? "",
        cover: toImageView(featured.coverImage),
        category: (featured.category ?? "technology") as PostCategory,
        publishedAt: featured.publishedAt
          ? featured.publishedAt.toISOString()
          : featured.createdAt.toISOString(),
        readingTime: featured.readingTime ?? 5,
        featured: true,
      };
    }

    const latest = await Post.findOne({ state: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .populate("coverImage", FILE_FIELDS)
      .lean<
        (Omit<IPost, "coverImage"> & {
          _id: Types.ObjectId;
          coverImage?: FileLean | null;
        }) | null
      >();

    if (!latest) return null;

    return {
      id: String(latest._id),
      slug: latest.slug,
      number: 1,
      title: latest.title,
      excerpt: latest.excerpt ?? "",
      cover: toImageView(latest.coverImage),
      category: (latest.category ?? "technology") as PostCategory,
      publishedAt: latest.publishedAt
        ? latest.publishedAt.toISOString()
        : latest.createdAt.toISOString(),
      readingTime: latest.readingTime ?? 5,
      featured: latest.featured ?? false,
    };
  },
);

/** Category counts across all published posts. */
export const getCategoryCounts = cache(
  async (): Promise<Record<PostCategory, number>> => {
    await dbConnect();
    const counts = await Post.aggregate<{ _id: string; count: number }>([
      { $match: { state: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const result: Record<PostCategory, number> = {
      technology: 0,
      business: 0,
      ai: 0,
      process: 0,
    };

    counts.forEach((c) => {
      if (c._id && c._id in result) {
        result[c._id as PostCategory] = c.count;
      }
    });

    return result;
  },
);

/** Get single post by slug, or null. */
export const getPostBySlug = cache(
  async (slug: string): Promise<BlogPostDetailView | null> => {
    await dbConnect();
    const post = await Post.findOne({ slug, state: "published" })
      .populate("coverImage", FILE_FIELDS)
      .lean<
        (Omit<IPost, "coverImage"> & {
          _id: Types.ObjectId;
          coverImage?: FileLean | null;
        }) | null
      >();

    if (!post) return null;

    // Get order number among all published posts
    const olderCount = await Post.countDocuments({
      state: "published",
      publishedAt: { $lt: post.publishedAt ?? post.createdAt },
    });

    return {
      id: String(post._id),
      slug: post.slug,
      number: olderCount + 1,
      title: post.title,
      excerpt: post.excerpt ?? "",
      cover: toImageView(post.coverImage),
      category: (post.category ?? "technology") as PostCategory,
      tags: post.tags ?? [],
      body: isEditorDoc(post.body) ? post.body : null,
      publishedAt: post.publishedAt
        ? post.publishedAt.toISOString()
        : post.createdAt.toISOString(),
      readingTime: post.readingTime ?? 5,
      toc: post.toc ?? [],
      views: post.views ?? 0,
      series: post.series,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    };
  },
);

/** Get related posts in the same category, excluding current post. */
export const getRelatedPosts = cache(
  async (
    category: PostCategory,
    currentSlug: string,
    limit = 2,
  ): Promise<BlogPostSummaryView[]> => {
    await dbConnect();
    const posts = await Post.find({
      state: "published",
      category,
      slug: { $ne: currentSlug },
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .populate("coverImage", FILE_FIELDS)
      .lean<
        (Omit<IPost, "coverImage"> & {
          _id: Types.ObjectId;
          coverImage?: FileLean | null;
        })[]
      >();

    return posts.map((p, idx) => ({
      id: String(p._id),
      slug: p.slug,
      number: idx + 1,
      title: p.title,
      excerpt: p.excerpt ?? "",
      cover: toImageView(p.coverImage),
      category: (p.category ?? "technology") as PostCategory,
      publishedAt: p.publishedAt
        ? p.publishedAt.toISOString()
        : p.createdAt.toISOString(),
      readingTime: p.readingTime ?? 5,
      featured: p.featured ?? false,
    }));
  },
);

/** Get latest published posts for the home page. */
export const getRecentPostsForHome = cache(
  async (limit = 3): Promise<BlogPostSummaryView[]> => {
    await dbConnect();
    const posts = await Post.find({ state: "published" })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .populate("coverImage", FILE_FIELDS)
      .lean<
        (Omit<IPost, "coverImage"> & {
          _id: Types.ObjectId;
          coverImage?: FileLean | null;
        })[]
      >();

    return posts.map((p, idx) => ({
      id: String(p._id),
      slug: p.slug,
      number: posts.length - idx,
      title: p.title,
      excerpt: p.excerpt ?? "",
      cover: toImageView(p.coverImage),
      category: (p.category ?? "technology") as PostCategory,
      publishedAt: p.publishedAt
        ? p.publishedAt.toISOString()
        : p.createdAt.toISOString(),
      readingTime: p.readingTime ?? 5,
      featured: p.featured ?? false,
    }));
  },
);

/** Slugs of all published posts for static generation. */
export async function getAllPublishedPostSlugs(): Promise<string[]> {
  await dbConnect();
  const rows = await Post.find({ state: "published" })
    .select("slug")
    .lean<{ slug: string }[]>();
  return rows.map((r) => r.slug);
}
