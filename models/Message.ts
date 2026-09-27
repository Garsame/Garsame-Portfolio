import { Schema } from "mongoose";
import { EMAIL_PATTERN, defineModel } from "./shared";

/**
 * `messages` — the contact form. docs/05-DATA-MODEL.md; docs/04-ADMIN.md §7.
 *
 * The sender's IP is kept for rate limiting and abuse, and is `select: false`
 * so it is never loaded by accident.
 */

export interface IMessage {
  name: string;
  email: string;
  business?: string;
  need?: string;
  message: string;
  read: boolean;
  archived: boolean;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    name: {
      type: String,
      required: [true, "Please add your name."],
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, "Please add your email so I can reply."],
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, "That is not a valid email address."],
    },
    business: { type: String, trim: true, maxlength: 160 },
    /* the "What do you need?" select value */
    need: { type: String, trim: true, maxlength: 120 },
    message: {
      type: String,
      required: [true, "Please tell me about the problem."],
      trim: true,
      maxlength: [5000, "Please keep the message under 5,000 characters."],
    },
    read: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    ip: { type: String, select: false },
  },
  { timestamps: true, collection: "messages" },
);

/* The inbox, and the unread counts in the sidebar and on the dashboard. */
messageSchema.index({ archived: 1, read: 1, createdAt: -1 });

export const Message = defineModel<IMessage>("Message", messageSchema);
