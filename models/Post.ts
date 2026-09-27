import { Schema, type Types } from "mongoose";
import {
  isEmptyDoc,
  plainText,
  readingTime,
  tableOfContents,
  type TocEntry,
} from "@/lib/editor-content";
import { isSlug, slugTaken, slugify, uniqueSlug } from "@/lib/slug";
import {
  CONTENT_STATES,
  assertNoProblems,
  defineModel,
  explainDuplicates,
  protectFields,
} from "./shared";

/**
 * `posts` — docs/05-DATA-MODEL.md; publish rules from docs/04-ADMIN.md §4.
 *
 * As with projects: a draft needs a title and a slug; the rest is required to
 * publish. D-045.
 *
 * Scheduling. docs/04-ADMIN.md has "Draft · Published · Archived, plus schedule
 * for later". A scheduled post is a draft with `scheduledFor` set; the Phase 8
 * job publishes it when the time comes. Because it will publish without anyone
 * looking, it must already pass every publish rule at the moment it is
 * scheduled — a half-written post cannot be queued to go out by itself. D-048.
 *
 * On every save the body is turned into `bodyText`, `readingTime` and `toc`.
 */

export const POST_CATEGORIES = [
  "technology",
  "business",
  "ai",
  "process",
] as const;

/** "Featured flag … max 1 enforced in the API." Enforced here. */
export const MAX_FEATURED_POSTS = 1;
export const POST_EXCERPT_MAX = 160;

export interface IPost {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: Types.ObjectId;
  category?: (typeof POST_CATEGORIES)[number];
  tags: string[];
  body?: unknown;
  bodyText?: string;
  readingTime?: number;
  toc: TocEntry[];

  state: (typeof CONTENT_STATES)[number];
  featured: boolean;
  publishedAt?: Date;
  scheduledFor?: Date;
  views: number;
  series?: string;
  seoTitle?: string;
  seoDescription?: string;

  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, "Give the post a title."],
      trim: true,
      maxlength: 160,
    },
    slug: { type: String, required: true, unique: true, trim: true },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [
        POST_EXCERPT_MAX,
        `The excerpt can be at most ${POST_EXCERPT_MAX} characters.`,
      ],
    },
    coverImage: { type: Schema.Types.ObjectId, ref: "File" },
    category: { type: String, enum: POST_CATEGORIES },
    tags: {
      type: [{ type: String, trim: true, lowercase: true }],
      default: [],
    },
    /* The editor document. Reassign, or markModified("body") after an
       in-place change, or the derived fields will not recompute. */
    body: { type: Schema.Types.Mixed },
    bodyText: String,
    readingTime: { type: Number, min: 1 },
    toc: {
      type: [
        {
          _id: false,
          level: { type: Number, required: true },
          text: { type: String, required: true },
          anchor: { type: String, required: true },
        },
      ],
      default: [],
    },

    state: {
      type: String,
      enum: CONTENT_STATES,
      default: "draft",
      required: true,
    },
    featured: { type: Boolean, default: false },
    publishedAt: Date,
    scheduledFor: Date,
    views: { type: Number, default: 0, min: 0 },
    series: { type: String, trim: true },
    seoTitle: { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 160 },
  },
  { timestamps: true, collection: "posts" },
);

/* docs/05-DATA-MODEL.md: slug unique, { state, publishedAt: -1 }, { category } */
postSchema.index({ state: 1, publishedAt: -1 });
postSchema.index({ category: 1 });

postSchema.pre("validate", async function () {
  const Post = this.constructor as typeof PostModel;
  const problems: Record<string, string> = {};

  /* ---- slug ---- */
  if (!this.slug) {
    this.slug = await uniqueSlug(Post, this.title ?? "", this._id);
  } else if (this.isModified("slug")) {
    const cleaned = slugify(this.slug);
    if (!isSlug(cleaned)) {
      problems.slug =
        "The slug can only use lowercase letters, numbers and hyphens.";
    } else {
      this.slug = cleaned;
      if (await slugTaken(Post, cleaned, this._id)) {
        problems.slug = `The slug "${cleaned}" is already used by another post.`;
      }
    }
  }

  /* ---- derived from the body, on every change ---- */
  if (this.isModified("body") || this.isNew) {
    this.bodyText = plainText(this.body);
    this.readingTime = readingTime(this.body);
    this.toc = tableOfContents(this.body);
  }

  if (this.state === "archived" && this.featured) this.featured = false;

  /* A published or archived post is not waiting to be scheduled. */
  if (this.state !== "draft" && this.scheduledFor)
    this.scheduledFor = undefined;

  /* ---- required to publish, or to schedule — docs/04-ADMIN.md §4 ---- */
  const goingOut = this.state === "published" || Boolean(this.scheduledFor);
  if (goingOut) {
    if (!this.excerpt) problems.excerpt = "Write the excerpt.";
    if (!this.coverImage) problems.coverImage = "Add a cover image.";
    if (!this.category) problems.category = "Choose a category.";
    if (isEmptyDoc(this.body)) problems.body = "The post has no content yet.";
  }

  if (
    this.scheduledFor &&
    this.isModified("scheduledFor") &&
    this.scheduledFor.getTime() <= Date.now()
  ) {
    problems.scheduledFor = "Schedule it for a time in the future.";
  }

  if (
    this.state === "published" &&
    !this.publishedAt &&
    Object.keys(problems).length === 0
  ) {
    this.publishedAt = new Date();
  }

  /* ---- at most one featured post ---- */
  if (this.featured && (this.isModified("featured") || this.isNew)) {
    const others = await Post.countDocuments({
      featured: true,
      _id: { $ne: this._id },
    });
    if (others >= MAX_FEATURED_POSTS) {
      problems.featured =
        "Only one post can be featured. Unfeature the current one first.";
    }
  }

  assertNoProblems(problems);
});

protectFields(postSchema, ["state", "featured", "body", "scheduledFor"]);
explainDuplicates(postSchema, {
  slug: "That slug is already used by another post.",
});

const PostModel = defineModel<IPost>("Post", postSchema);
export const Post = PostModel;
