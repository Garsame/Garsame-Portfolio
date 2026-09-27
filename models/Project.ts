import { Schema, Types } from "mongoose";
import { imageFileIds, plainText } from "@/lib/editor-content";
import {
  MAX_FEATURED_PROJECTS,
  PROJECT_SEO_DESCRIPTION_MAX,
  PROJECT_SEO_TITLE_MAX,
  PROJECT_STATUSES,
  PROJECT_SUMMARY_MAX,
  PROJECT_TITLE_MAX,
  PROJECT_TYPES,
  projectPublishProblems,
} from "@/lib/project-rules";
import { isSlug, slugTaken, slugify, uniqueSlug } from "@/lib/slug";
import { StoredFile } from "./File";
import {
  CONTENT_STATES,
  assertNoProblems,
  defineModel,
  explainDuplicates,
  protectFields,
  topPosition,
} from "./shared";

/**
 * `projects` — docs/05-DATA-MODEL.md; publish rules from docs/04-ADMIN.md §5.
 *
 * Required-to-publish, not required-to-save. The data model marks the case
 * study fields "required", but docs/04-ADMIN.md lists the same fields under
 * "Required to publish", and the editor autosaves drafts every few seconds —
 * a half-written draft has to be saveable. So a draft needs only a title and a
 * slug; everything else is checked the moment the state becomes `published`,
 * with one message per missing field. D-045. The rules themselves live in
 * lib/project-rules.ts, shared with the editor.
 *
 * All of this runs in pre("validate"), i.e. on `doc.save()`. `state`,
 * `featured` and `body` are protected from direct query updates so the rules
 * cannot be skipped — see protectFields in ./shared.
 */

export {
  MAX_FEATURED_PROJECTS,
  PROJECT_STATUSES,
  PROJECT_SUMMARY_MAX,
  PROJECT_TYPES,
};

/** The optional heading above each written block — D-068. */
export type ProjectHeadings = {
  problem?: string;
  constraints?: string;
  body?: string;
  outcome?: string;
};

export interface IProject {
  title: string;
  slug: string;
  client?: string;
  year?: number;
  type?: (typeof PROJECT_TYPES)[number];
  status?: (typeof PROJECT_STATUSES)[number];
  summary?: string;
  coverImage?: Types.ObjectId;
  problem?: string;
  body?: unknown;
  bodyText?: string;
  stack: string[];
  headings?: ProjectHeadings;

  constraints?: unknown;
  decisions: { decision: string; reason?: string }[];
  outcome?: unknown;
  gallery: { file: Types.ObjectId; caption?: string }[];
  liveUrl?: string;
  repoUrl?: string;
  role?: string;
  team: string[];
  clientQuote?: Types.ObjectId;
  timeline?: string;
  customSections: {
    _id?: Types.ObjectId;
    heading: string;
    body?: unknown;
    image?: Types.ObjectId;
  }[];

  state: (typeof CONTENT_STATES)[number];
  featured: boolean;
  position: number;
  publishedAt?: Date;
  views: number;
  seoTitle?: string;
  seoDescription?: string;

  createdAt: Date;
  updatedAt: Date;
}

const url = {
  validator: (v: string) => !v || /^https?:\/\/\S+$/i.test(v),
  message: "Links must start with http:// or https://.",
};

const heading = { type: String, trim: true, maxlength: 140 };

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, "Give the project a title."],
      trim: true,
      maxlength: PROJECT_TITLE_MAX,
    },
    slug: { type: String, required: true, unique: true, trim: true },
    client: { type: String, trim: true, maxlength: 140 },
    year: { type: Number, min: 2000, max: 2100 },
    type: { type: String, enum: PROJECT_TYPES },
    status: { type: String, enum: PROJECT_STATUSES },
    summary: {
      type: String,
      trim: true,
      maxlength: [
        PROJECT_SUMMARY_MAX,
        `The summary can be at most ${PROJECT_SUMMARY_MAX} characters.`,
      ],
    },
    coverImage: { type: Schema.Types.ObjectId, ref: "File" },
    problem: { type: String, trim: true, maxlength: 5000 },
    /* The editor document. Mixed, so mutate by reassigning, or call
       markModified("body") after changing it in place. */
    body: { type: Schema.Types.Mixed },
    bodyText: String,
    stack: { type: [{ type: String, trim: true }], default: [] },
    headings: {
      problem: heading,
      constraints: heading,
      body: heading,
      outcome: heading,
    },

    /* optional blocks — omitted from the public page when empty */
    constraints: Schema.Types.Mixed,
    decisions: {
      type: [
        {
          _id: false,
          decision: { type: String, required: true, trim: true },
          reason: { type: String, trim: true },
        },
      ],
      default: [],
    },
    outcome: Schema.Types.Mixed,
    gallery: {
      type: [
        {
          _id: false,
          file: { type: Schema.Types.ObjectId, ref: "File", required: true },
          caption: { type: String, trim: true },
        },
      ],
      default: [],
    },
    liveUrl: { type: String, trim: true, validate: url },
    repoUrl: { type: String, trim: true, validate: url },
    role: { type: String, trim: true },
    team: { type: [{ type: String, trim: true }], default: [] },
    clientQuote: { type: Schema.Types.ObjectId, ref: "Testimonial" },
    timeline: { type: String, trim: true },
    customSections: {
      type: [
        {
          heading: { type: String, required: true, trim: true },
          body: Schema.Types.Mixed,
          image: { type: Schema.Types.ObjectId, ref: "File" },
        },
      ],
      default: [],
    },

    /* control */
    state: {
      type: String,
      enum: CONTENT_STATES,
      default: "draft",
      required: true,
    },
    featured: { type: Boolean, default: false },
    position: { type: Number, required: true },
    publishedAt: Date,
    views: { type: Number, default: 0, min: 0 },
    seoTitle: { type: String, trim: true, maxlength: PROJECT_SEO_TITLE_MAX },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: PROJECT_SEO_DESCRIPTION_MAX,
    },
  },
  { timestamps: true, collection: "projects" },
);

/* docs/05-DATA-MODEL.md: slug unique, { state, position }, { featured, position } */
projectSchema.index({ state: 1, position: 1 });
projectSchema.index({ featured: 1, position: 1 });

projectSchema.pre("validate", async function () {
  const Project = this.constructor as typeof ProjectModel;
  const problems: Record<string, string> = {};

  /* ---- slug: generated from the title unless Garsame typed one ---- */
  if (!this.slug) {
    this.slug = await uniqueSlug(Project, this.title ?? "", this._id);
  } else if (this.isModified("slug")) {
    const cleaned = slugify(this.slug);
    if (!isSlug(cleaned)) {
      problems.slug =
        "The slug can only use lowercase letters, numbers and hyphens.";
    } else {
      this.slug = cleaned;
      if (await slugTaken(Project, cleaned, this._id)) {
        problems.slug = `The slug "${cleaned}" is already used by another project.`;
      }
    }
  }

  /* ---- derived text ---- */
  if (this.isModified("body") || this.isNew) {
    this.bodyText = plainText(this.body);
  }

  /* ---- a new project goes to the top of the manual order ---- */
  if (this.isNew && typeof this.position !== "number") {
    this.position = await topPosition(Project);
  }

  /* ---- leaving "published" releases a featured slot ----
     A featured draft would hold one of the three places without appearing on
     the home page. Unpublishing or archiving takes it off. D-069. */
  if (this.state !== "published" && this.featured) {
    if (this.isModified("state") && !this.isNew) {
      this.featured = false;
    } else {
      problems.featured = "Publish the project before featuring it.";
    }
  }

  /* ---- required to publish — docs/04-ADMIN.md §5 ---- */
  if (this.state === "published") {
    Object.assign(
      problems,
      projectPublishProblems({
        client: this.client,
        year: this.year,
        type: this.type,
        status: this.status,
        summary: this.summary,
        coverImage: this.coverImage,
        problem: this.problem,
        body: this.body,
        stack: this.stack,
      }),
    );

    if (!this.publishedAt && Object.keys(problems).length === 0) {
      this.publishedAt = new Date();
    }
  }

  /* ---- at most three featured — docs/05-DATA-MODEL.md ---- */
  if (this.featured && (this.isModified("featured") || this.isNew)) {
    const others = await Project.countDocuments({
      featured: true,
      _id: { $ne: this._id },
    });
    if (others >= MAX_FEATURED_PROJECTS) {
      problems.featured = `Only ${MAX_FEATURED_PROJECTS} projects can be featured. Unfeature one first.`;
    }
  }

  assertNoProblems(problems);
});

/* ---- which files this project uses ----
   docs/04-ADMIN.md §9: the Files module "shows which post or project uses a
   file before allowing deletion". Kept up to date on every save, so a cover
   still in use can never be deleted from under a published page. D-071. */

function filesUsed(doc: IProject): Types.ObjectId[] {
  /* Images placed inside the writing count too — the block editor can put one
     anywhere in a document (Phase 7). */
  const inWriting = [doc.body, doc.constraints, doc.outcome]
    .concat((doc.customSections ?? []).map((s) => s.body))
    .flatMap(imageFileIds)
    .map((id) => new Types.ObjectId(id));

  const ids = [
    ...inWriting,
    doc.coverImage,
    ...(doc.gallery ?? []).map((g) => g.file),
    ...(doc.customSections ?? []).map((s) => s.image),
  ].filter((id): id is Types.ObjectId => Boolean(id));
  return [...new Map(ids.map((id) => [String(id), id])).values()];
}

projectSchema.post("save", async function () {
  const ids = filesUsed(this);
  const usage = { model: "Project", id: this._id };
  if (ids.length > 0) {
    await StoredFile.updateMany(
      { _id: { $in: ids }, usedBy: { $not: { $elemMatch: usage } } },
      { $push: { usedBy: usage } },
    );
  }
  await StoredFile.updateMany(
    { _id: { $nin: ids }, usedBy: { $elemMatch: usage } },
    { $pull: { usedBy: usage } },
  );
});

projectSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function () {
    await StoredFile.updateMany(
      {},
      { $pull: { usedBy: { model: "Project", id: this._id } } },
    );
  },
);

protectFields(projectSchema, ["state", "featured", "body"]);
explainDuplicates(projectSchema, {
  slug: "That slug is already used by another project.",
});

const ProjectModel = defineModel<IProject>("Project", projectSchema);
export const Project = ProjectModel;
