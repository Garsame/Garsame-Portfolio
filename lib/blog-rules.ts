export const POST_CATEGORIES = [
  "technology",
  "business",
  "ai",
  "process",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  technology: "Technology",
  business: "Business",
  ai: "AI",
  process: "Process",
};

export const POST_TITLE_MAX = 160;
export const POST_EXCERPT_MAX = 160;
export const POST_SEO_TITLE_MAX = 70;
export const POST_SEO_DESCRIPTION_MAX = 160;
export const MAX_FEATURED_POSTS = 1;
