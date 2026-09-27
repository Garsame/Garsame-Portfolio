import type { PostCategory } from "@/lib/blog-rules";
import type { EditorNode } from "@/lib/editor-content";
import type { ImageView } from "@/lib/project-view";
import type { ContentState, SaveIntent } from "@/lib/project-form";

export type BlogForm = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  cover: ImageView | null;
  category: PostCategory | "";
  tags: string[];
  body: EditorNode | null;
  featured: boolean;
  series: string;
  scheduledFor: string;
  seoTitle: string;
  seoDescription: string;
};

export type BlogMeta = {
  state: ContentState;
  slug: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  updatedAt: string | null;
  views: number;
  readingTime: number;
  tocCount: number;
};

export type BlogPayload = {
  id: string | null;
  intent: SaveIntent;
  title: string;
  slug: string;
  excerpt: string;
  coverId: string | null;
  category: string;
  tags: string[];
  body: unknown;
  featured: boolean;
  series: string;
  scheduledFor: string | null;
  seoTitle: string;
  seoDescription: string;
  alts?: { id: string; alt: string }[];
};

export function emptyBlogForm(templateDoc?: EditorNode, category?: PostCategory): BlogForm {
  return {
    id: null,
    title: "",
    slug: "",
    excerpt: "",
    cover: null,
    category: category ?? "technology",
    tags: [],
    body: templateDoc ?? null,
    featured: false,
    series: "",
    scheduledFor: "",
    seoTitle: "",
    seoDescription: "",
  };
}
