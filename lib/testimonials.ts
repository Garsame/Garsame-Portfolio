import "server-only";

import { cache } from "react";
import { dbConnect } from "@/lib/db";
import { Testimonial, type ITestimonial } from "@/models";
import type { Types } from "mongoose";

export type TestimonialView = {
  id: string;
  name: string;
  role?: string;
  business?: string;
  quote: string;
  photoUrl?: string | null;
  publishedAt?: string;
};

type PopulatedFile = {
  _id: Types.ObjectId;
  url: string;
};

type LeanTestimonial = ITestimonial & {
  _id: Types.ObjectId;
  photo?: PopulatedFile | null;
};

/**
 * Returns featured published testimonials for the home page (up to 2).
 * If fewer than 2 are explicitly marked featured, falls back to top-positioned published ones.
 */
export const getFeaturedTestimonials = cache(
  async (): Promise<TestimonialView[]> => {
    await dbConnect();

    // 1. Try to find explicitly featured published testimonials
    let docs = (await Testimonial.find({
      status: "published",
      featured: true,
    })
      .sort({ position: 1, publishedAt: -1 })
      .limit(2)
      .populate("photo", "url")
      .lean()) as unknown as LeanTestimonial[];

    // 2. If fewer than 2 featured, fill with top published testimonials
    if (docs.length < 2) {
      const existingIds = docs.map((d) => d._id);
      const additional = (await Testimonial.find({
        status: "published",
        _id: { $nin: existingIds },
      })
        .sort({ position: 1, publishedAt: -1 })
        .limit(2 - docs.length)
        .populate("photo", "url")
        .lean()) as unknown as LeanTestimonial[];

      docs = [...docs, ...additional];
    }

    return docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      role: doc.role || undefined,
      business: doc.business || undefined,
      quote: doc.quote,
      photoUrl: doc.photo?.url || null,
      publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : undefined,
    }));
  },
);

/**
 * Returns all published testimonials for `/testimonials`.
 */
export const getAllPublishedTestimonials = cache(
  async (): Promise<TestimonialView[]> => {
    await dbConnect();

    const docs = (await Testimonial.find({ status: "published" })
      .sort({ position: 1, publishedAt: -1 })
      .populate("photo", "url")
      .lean()) as unknown as LeanTestimonial[];

    return docs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      role: doc.role || undefined,
      business: doc.business || undefined,
      quote: doc.quote,
      photoUrl: doc.photo?.url || null,
      publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : undefined,
    }));
  },
);
