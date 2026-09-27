import { randomBytes } from "node:crypto";
import { Schema } from "mongoose";
import { EMAIL_PATTERN, defineModel, explainDuplicates } from "./shared";

/**
 * `members` — docs/05-DATA-MODEL.md; docs/04-ADMIN.md §2.
 *
 * "Unsubscribing sets `status`; it never deletes the member record." The
 * record stays so a later broadcast cannot re-add someone who left, and so the
 * mail log still makes sense. Removing a member entirely is a separate, deliberate
 * admin action with its own confirmation.
 *
 * Every member gets an unguessable unsubscribe token at creation — 32 random
 * bytes — so an unsubscribe link cannot be forged for someone else's address.
 */

export const MEMBER_STATUSES = ["active", "unsubscribed"] as const;
export const MEMBER_SOURCES = ["home", "membership", "blog", "footer"] as const;

export interface IMember {
  firstName: string;
  lastName?: string;
  email: string;
  status: (typeof MEMBER_STATUSES)[number];
  source?: (typeof MEMBER_SOURCES)[number];
  unsubToken: string;
  joinedAt: Date;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const newUnsubToken = () => randomBytes(32).toString("base64url");

const memberSchema = new Schema<IMember>(
  {
    firstName: {
      type: String,
      required: [true, "Please add your first name."],
      trim: true,
      maxlength: 80,
    },
    lastName: { type: String, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, "Please add your email address."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, "That is not a valid email address."],
    },
    status: {
      type: String,
      enum: MEMBER_STATUSES,
      default: "active",
      required: true,
    },
    source: { type: String, enum: MEMBER_SOURCES },
    unsubToken: {
      type: String,
      required: true,
      unique: true,
      default: newUnsubToken,
    },
    joinedAt: { type: Date, required: true, default: () => new Date() },
    unsubscribedAt: Date,
  },
  { timestamps: true, collection: "members" },
);

memberSchema.index({ status: 1, joinedAt: -1 });

memberSchema.pre("validate", function () {
  if (!this.isModified("status")) return;
  if (this.status === "unsubscribed" && !this.unsubscribedAt) {
    this.unsubscribedAt = new Date();
  }
  if (this.status === "active") this.unsubscribedAt = undefined;
});

explainDuplicates(memberSchema, {
  email: "That email address is already a member.",
  unsubToken: "Could not create a unique unsubscribe link — please try again.",
});

export const Member = defineModel<IMember>("Member", memberSchema);
