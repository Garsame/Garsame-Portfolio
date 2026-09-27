import { Schema, type Types } from "mongoose";
import { EMAIL_PATTERN, assertNoProblems, defineModel } from "./shared";

/**
 * `maillogs` — "Every send, without exception." docs/05-DATA-MODEL.md.
 *
 * CLAUDE.md rule 5: every email send is logged with recipient, subject, status,
 * timestamp and error. No silent sends. The mail module in Phase 10 writes an
 * entry as `queued` before it sends and updates it after, so a send that
 * crashes halfway still leaves a trace.
 */

export const MAIL_TYPES = [
  "welcome",
  "broadcast",
  "contact-notify",
  "testimonial-notify",
  "test",
] as const;

export const MAIL_STATUSES = ["queued", "sent", "failed", "bounced"] as const;

export interface IMailLog {
  type: (typeof MAIL_TYPES)[number];
  broadcast?: Types.ObjectId;
  to: string;
  subject: string;
  status: (typeof MAIL_STATUSES)[number];
  error?: string;
  attempts: number;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mailLogSchema = new Schema<IMailLog>(
  {
    type: { type: String, enum: MAIL_TYPES, required: true },
    broadcast: { type: Schema.Types.ObjectId, ref: "Broadcast" },
    to: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, "That is not a valid email address."],
    },
    subject: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: MAIL_STATUSES,
      default: "queued",
      required: true,
    },
    /* The SMTP server's own message, kept whole — it is the only way to tell
       why a send failed. */
    error: { type: String, maxlength: 4000 },
    attempts: { type: Number, default: 0, min: 0 },
    sentAt: Date,
  },
  { timestamps: true, collection: "maillogs" },
);

/* docs/05-DATA-MODEL.md: { broadcast, status }, { sentAt: -1 } */
mailLogSchema.index({ broadcast: 1, status: 1 });
mailLogSchema.index({ sentAt: -1 });
/* The dashboard's "failed email sends" attention item. */
mailLogSchema.index({ status: 1, createdAt: -1 });

mailLogSchema.pre("validate", function () {
  if (this.status === "sent" && !this.sentAt) this.sentAt = new Date();
  assertNoProblems(
    this.type === "broadcast" && !this.broadcast
      ? { broadcast: "A broadcast send must name its broadcast." }
      : {},
  );
});

export const MailLog = defineModel<IMailLog>("MailLog", mailLogSchema);
