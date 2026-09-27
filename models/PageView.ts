import { Schema } from "mongoose";
import { defineModel } from "./shared";

/**
 * `pageviews` and `stats_daily` — first-party counting. docs/05-DATA-MODEL.md;
 * docs/04-ADMIN.md §8.
 *
 * "Store no personal data here — no IP, no user agent fingerprint." There is
 * no field that could hold either. `sessionId` is a random value the site
 * creates, not something derived from the visitor.
 *
 * Raw views are "aggregated nightly into stats_daily so the dashboard never
 * scans the raw collection." The document names stats_daily but not its
 * fields; the shape below is the smallest one that answers the Stats module's
 * questions — views over time, by page, and referrers. D-051.
 */

export interface IPageView {
  path: string;
  referrer?: string;
  device?: "Phone" | "Computer" | "Tablet";
  sessionId?: string;
  viewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pageViewSchema = new Schema<IPageView>(
  {
    path: { type: String, required: true, trim: true, maxlength: 500 },
    /* Host only, not the full referring URL, which can carry personal data
       in its query string. The Phase 12 counter trims it before saving. */
    referrer: { type: String, trim: true, maxlength: 255 },
    device: {
      type: String,
      enum: ["Phone", "Computer", "Tablet"],
      default: "Computer",
    },
    sessionId: { type: String, trim: true, maxlength: 64 },
    viewedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true, collection: "pageviews" },
);

pageViewSchema.index({ viewedAt: -1 });
pageViewSchema.index({ path: 1, viewedAt: -1 });

export const PageView = defineModel<IPageView>("PageView", pageViewSchema);

/* ------------------------------------------------------------ stats_daily */

export interface IStatsDaily {
  /** The day, as YYYY-MM-DD in Africa/Mogadishu time. */
  date: string;
  /** A page path, or "*" for the whole site that day. */
  path: string;
  views: number;
  /** Distinct sessionIds that day. */
  sessions: number;
  /** Top referring hosts for that page and day, with counts. */
  referrers: { host: string; views: number }[];
  /** Device distribution breakdown for that page and day. */
  devices?: {
    phone: number;
    computer: number;
    tablet: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const statsDailySchema = new Schema<IStatsDaily>(
  {
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "The date must be YYYY-MM-DD."],
    },
    path: { type: String, required: true, trim: true },
    views: { type: Number, required: true, default: 0, min: 0 },
    sessions: { type: Number, required: true, default: 0, min: 0 },
    referrers: {
      type: [
        {
          _id: false,
          host: { type: String, required: true },
          views: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
    devices: {
      phone: { type: Number, default: 0, min: 0 },
      computer: { type: Number, default: 0, min: 0 },
      tablet: { type: Number, default: 0, min: 0 },
    },
  },
  { timestamps: true, collection: "stats_daily" },
);

/* One row per page per day; re-running the nightly job overwrites, never
   double-counts. */
statsDailySchema.index({ date: 1, path: 1 }, { unique: true });
statsDailySchema.index({ path: 1, date: -1 });

export const StatsDaily = defineModel<IStatsDaily>(
  "StatsDaily",
  statsDailySchema,
);
