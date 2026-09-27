import { Schema } from "mongoose";
import { isEmptyDoc, plainText } from "@/lib/editor-content";
import { assertNoProblems, defineModel, protectFields } from "./shared";

/**
 * `broadcasts` — docs/05-DATA-MODEL.md; docs/04-ADMIN.md §3.
 *
 * A draft needs only a subject. It cannot leave `draft` — be scheduled or
 * start sending — without a body, and a scheduled broadcast needs a time in
 * the future. "A broadcast to 400 members must never be a black box": the
 * delivered and failed counts are kept here, and every individual send is in
 * `maillogs`.
 */

export const BROADCAST_STATES = [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "failed",
] as const;

export interface IBroadcast {
  subject: string;
  previewText?: string;
  body?: unknown;
  bodyText?: string;
  state: (typeof BROADCAST_STATES)[number];
  scheduledFor?: Date;
  sentAt?: Date;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const broadcastSchema = new Schema<IBroadcast>(
  {
    subject: {
      type: String,
      required: [true, "Give the update a subject line."],
      trim: true,
      maxlength: 150,
    },
    previewText: { type: String, trim: true, maxlength: 200 },
    body: { type: Schema.Types.Mixed },
    bodyText: String,
    state: {
      type: String,
      enum: BROADCAST_STATES,
      default: "draft",
      required: true,
    },
    scheduledFor: Date,
    sentAt: Date,
    recipientCount: { type: Number, default: 0, min: 0 },
    deliveredCount: { type: Number, default: 0, min: 0 },
    failedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "broadcasts" },
);

broadcastSchema.index({ state: 1, scheduledFor: 1 });

broadcastSchema.pre("validate", function () {
  const problems: Record<string, string> = {};

  if (this.isModified("body") || this.isNew) {
    this.bodyText = plainText(this.body);
  }

  if (this.state !== "draft" && isEmptyDoc(this.body)) {
    problems.body = "The update has no content yet.";
  }

  if (this.state === "scheduled") {
    if (!this.scheduledFor) {
      problems.scheduledFor = "Choose when to send it.";
    } else if (
      this.isModified("scheduledFor") &&
      this.scheduledFor.getTime() <= Date.now()
    ) {
      problems.scheduledFor = "Schedule it for a time in the future.";
    }
  }

  if (this.state === "sent" && !this.sentAt) this.sentAt = new Date();

  assertNoProblems(problems);
});

/* The sending queue (Phase 11) moves a broadcast through its states with
   save(), so the checks above run on every transition. The counters are left
   open to $inc, which is how a queue should update them. */
protectFields(broadcastSchema, ["state", "body"]);

export const Broadcast = defineModel<IBroadcast>("Broadcast", broadcastSchema);
