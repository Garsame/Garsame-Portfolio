import { Schema, type Types } from "mongoose";
import {
  EMAIL_PATTERN,
  assertNoProblems,
  defineModel,
  explainDuplicates,
} from "./shared";

/**
 * `settings` — a single document, `key: "site"`. docs/05-DATA-MODEL.md;
 * edited through Branding & Look and Settings, docs/04-ADMIN.md §10–11.
 *
 * There are no colour fields, and there never will be: CLAUDE.md rule 2,
 * "colours live in code." Everything visible that is not a colour is here.
 *
 * `key` is restricted to "site" and unique, so a second settings document
 * cannot exist.
 */

export const AVAILABILITY = ["available", "limited", "booked"] as const;

/** The badge's icon tint — "label, value, icon colour", docs/04-ADMIN.md §10.
    The icon itself follows from the tone: bolt, check, clock. D-050. */
export const BADGE_TONES = ["warning", "success", "accent"] as const;

export const SERVICE_ICONS = [
  "screen",
  "phone",
  "chart",
  "mail",
  "automation",
  "support",
] as const;

export interface ISettings {
  key: "site";

  bioShort?: string;
  bioLong?: string;
  phone?: string;
  email?: string;
  location?: string;
  socialLinks: { platform: string; url: string }[];
  cvFile?: Types.ObjectId;
  logo?: Types.ObjectId;
  availability: (typeof AVAILABILITY)[number];
  availabilityText?: string;

  heroHeadingLine1?: string;
  heroHeadingLine2Prefix?: string;
  heroRotatingWords: string[];
  heroParagraph?: string;
  heroPortrait?: Types.ObjectId;
  heroBadges: {
    label: string;
    value: string;
    tone: (typeof BADGE_TONES)[number];
  }[];
  breakImage?: Types.ObjectId;

  /** Order is the drag order in Settings → Client list, top to bottom. */
  clients: { name: string; avatar?: Types.ObjectId }[];
  faq: { question: string; answer?: string; order: number }[];
  services: {
    title: string;
    description: string;
    icon: (typeof SERVICE_ICONS)[number];
    order: number;
  }[];
  processSteps: { title: string; description: string; order: number }[];

  metaDescription?: string;
  socialImage?: Types.ObjectId;

  smtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    passEncrypted?: string;
    fromName?: string;
    fromEmail?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: {
      type: String,
      enum: ["site"],
      default: "site",
      required: true,
      unique: true,
    },

    bioShort: { type: String, trim: true, maxlength: 300 },
    bioLong: { type: String, trim: true, maxlength: 5000 },
    phone: { type: String, trim: true, maxlength: 40 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [EMAIL_PATTERN, "That is not a valid email address."],
    },
    location: { type: String, trim: true, maxlength: 120 },
    socialLinks: {
      type: [
        {
          _id: false,
          platform: { type: String, required: true, trim: true },
          url: {
            type: String,
            required: true,
            trim: true,
            match: [/^https?:\/\/\S+$/i, "Links must start with https://."],
          },
        },
      ],
      default: [],
    },
    cvFile: { type: Schema.Types.ObjectId, ref: "File" },
    logo: { type: Schema.Types.ObjectId, ref: "File" },
    availability: {
      type: String,
      enum: AVAILABILITY,
      default: "available",
      required: true,
    },
    availabilityText: { type: String, trim: true, maxlength: 60 },

    heroHeadingLine1: { type: String, trim: true, maxlength: 60 },
    heroHeadingLine2Prefix: { type: String, trim: true, maxlength: 60 },
    heroRotatingWords: {
      type: [{ type: String, trim: true, maxlength: 30 }],
      default: [],
    },
    heroParagraph: { type: String, trim: true, maxlength: 400 },
    heroPortrait: { type: Schema.Types.ObjectId, ref: "File" },
    heroBadges: {
      type: [
        {
          _id: false,
          label: { type: String, required: true, trim: true, maxlength: 30 },
          value: { type: String, required: true, trim: true, maxlength: 40 },
          tone: { type: String, enum: BADGE_TONES, required: true },
        },
      ],
      default: [],
    },
    breakImage: { type: Schema.Types.ObjectId, ref: "File" },

    clients: {
      type: [
        {
          _id: false,
          name: { type: String, required: true, trim: true },
          avatar: { type: Schema.Types.ObjectId, ref: "File" },
        },
      ],
      default: [],
    },
    faq: {
      type: [
        {
          question: { type: String, required: true, trim: true },
          /* optional: an unanswered question renders a bracketed placeholder */
          answer: { type: String, trim: true },
          order: { type: Number, required: true },
        },
      ],
      default: [],
    },
    services: {
      type: [
        {
          title: { type: String, required: true, trim: true },
          description: { type: String, required: true, trim: true },
          icon: { type: String, enum: SERVICE_ICONS, required: true },
          order: { type: Number, required: true },
        },
      ],
      default: [],
    },
    processSteps: {
      type: [
        {
          title: { type: String, required: true, trim: true },
          description: { type: String, required: true, trim: true },
          order: { type: Number, required: true },
        },
      ],
      default: [],
    },

    metaDescription: { type: String, trim: true, maxlength: 160 },
    socialImage: { type: Schema.Types.ObjectId, ref: "File" },

    smtp: {
      host: { type: String, trim: true },
      port: { type: Number, min: 1, max: 65535 },
      secure: Boolean,
      user: { type: String, trim: true },
      /* Encrypted at rest with SETTINGS_ENCRYPTION_KEY (Phase 10), and never
         loaded unless a query asks for it by name. */
      passEncrypted: { type: String, select: false },
      fromName: { type: String, trim: true },
      fromEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [EMAIL_PATTERN, "That is not a valid email address."],
      },
    },
  },
  { timestamps: true, collection: "settings" },
);

settingsSchema.pre("validate", function () {
  const problems: Record<string, string> = {};
  /* "heroBadges [{ label, value, tone }] // exactly 3" */
  if (this.heroBadges.length !== 3) {
    problems.heroBadges = "The hero needs exactly three badges.";
  }
  assertNoProblems(problems);
});

explainDuplicates(settingsSchema, {
  key: "The site settings already exist. There is only one settings document.",
});

export const Settings = defineModel<ISettings>("Settings", settingsSchema);
