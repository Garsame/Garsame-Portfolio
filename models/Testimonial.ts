import { Schema, type Types } from "mongoose";
import {
  EMAIL_PATTERN,
  assertNoProblems,
  defineModel,
  protectFields,
  topPosition,
} from "./shared";

/**
 * `testimonials` — docs/05-DATA-MODEL.md; docs/04-ADMIN.md §6.
 *
 * CLAUDE.md rule 6: nothing user-submitted appears publicly without admin
 * approval. Every submission starts `pending`; only `status: "published"`
 * is ever shown, and `status` can only change through save() so it cannot be
 * flipped by a stray update.
 *
 * The submitter's email and IP are private — "never rendered publicly". They
 * are `select: false`, so no query returns them unless it explicitly asks with
 * .select("+email +submittedIp"). A public page cannot leak what it never
 * loaded. D-049.
 */

export const TESTIMONIAL_STATUSES = [
  "pending",
  "published",
  "rejected",
] as const;
export const TESTIMONIAL_QUOTE_MAX = 600;

export interface ITestimonial {
  name: string;
  role?: string;
  business?: string;
  email: string;
  photo?: Types.ObjectId;
  quote: string;
  consent: boolean;
  project?: Types.ObjectId;

  status: (typeof TESTIMONIAL_STATUSES)[number];
  featured: boolean;
  position?: number;
  submittedIp?: string;
  publishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    name: {
      type: String,
      required: [true, "Please add your name."],
      trim: true,
      maxlength: 120,
    },
    role: { type: String, trim: true, maxlength: 120 },
    business: { type: String, trim: true, maxlength: 160 },
    email: {
      type: String,
      required: [true, "Please add your email so it can be verified."],
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, "That is not a valid email address."],
      select: false,
    },
    photo: { type: Schema.Types.ObjectId, ref: "File" },
    quote: {
      type: String,
      required: [true, "Please write the testimonial."],
      trim: true,
      maxlength: [
        TESTIMONIAL_QUOTE_MAX,
        `The testimonial can be at most ${TESTIMONIAL_QUOTE_MAX} characters.`,
      ],
    },
    consent: {
      type: Boolean,
      required: true,
      validate: {
        validator: (v: boolean) => v === true,
        message:
          "Please confirm you are happy for this to be published with your name and business.",
      },
    },
    project: { type: Schema.Types.ObjectId, ref: "Project" },

    status: {
      type: String,
      enum: TESTIMONIAL_STATUSES,
      default: "pending",
      required: true,
    },
    featured: { type: Boolean, default: false },
    position: Number,
    submittedIp: { type: String, select: false },
    publishedAt: Date,
  },
  { timestamps: true, collection: "testimonials" },
);

/* docs/05-DATA-MODEL.md: { status, position } */
testimonialSchema.index({ status: 1, position: 1 });

testimonialSchema.pre("validate", async function () {
  const problems: Record<string, string> = {};

  if (this.status === "published") {
    if (!this.publishedAt) this.publishedAt = new Date();
    /* Published ones are drag-ordered; a newly published one goes on top. */
    if (typeof this.position !== "number") {
      this.position = await topPosition(
        this.constructor as typeof TestimonialModel,
        { status: "published" },
      );
    }
  }

  /* Featuring is a way of showing something, so only what is published can be
     featured — un-publishing also un-features. */
  if (this.status !== "published" && this.featured) {
    if (this.isModified("featured")) {
      problems.featured = "Publish the testimonial before featuring it.";
    } else {
      this.featured = false;
    }
  }

  assertNoProblems(problems);
});

protectFields(testimonialSchema, ["status", "featured"]);

const TestimonialModel = defineModel<ITestimonial>(
  "Testimonial",
  testimonialSchema,
);
export const Testimonial = TestimonialModel;
