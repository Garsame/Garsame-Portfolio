import "server-only";

import { type SortOrder, Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { Project, Testimonial, type ITestimonial } from "@/models";
import { topPosition } from "@/models/shared";
import { revalidatePath } from "next/cache";

export type AdminTestimonialItem = {
  id: string;
  name: string;
  role?: string;
  business?: string;
  email: string;
  quote: string;
  consent: boolean;
  status: "pending" | "published" | "rejected";
  featured: boolean;
  position?: number;
  submittedIp?: string;
  publishedAt?: string | null;
  createdAt: string;
  photo?: {
    id: string;
    url: string;
    alt?: string;
    width: number;
    height: number;
  } | null;
  project?: {
    id: string;
    title: string;
    slug: string;
  } | null;
};

export type AdminTestimonialsData = {
  testimonials: AdminTestimonialItem[];
  counts: {
    pending: number;
    published: number;
    rejected: number;
    all: number;
  };
};

export type AvailableProject = {
  id: string;
  title: string;
  slug: string;
};

/**
 * Loads testimonials with private details (email, IP) for admin moderation.
 */
export async function getAdminTestimonials(
  statusFilter?: "pending" | "published" | "rejected",
): Promise<AdminTestimonialsData> {
  await requireAdmin();
  await dbConnect();

  const [pendingCount, publishedCount, rejectedCount] = await Promise.all([
    Testimonial.countDocuments({ status: "pending" }),
    Testimonial.countDocuments({ status: "published" }),
    Testimonial.countDocuments({ status: "rejected" }),
  ]);

  const query = statusFilter ? { status: statusFilter } : {};

  // Sort: pending by createdAt desc; published by position asc, publishedAt desc; rejected by updatedAt desc
  const sortOption: Record<string, SortOrder> =
    statusFilter === "published"
      ? { position: 1, publishedAt: -1 }
      : statusFilter === "rejected"
        ? { updatedAt: -1 }
        : { createdAt: -1 };

  type PopulatedFile = {
    _id: Types.ObjectId;
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };

  type PopulatedProject = {
    _id: Types.ObjectId;
    title: string;
    slug: string;
  };

  type TestimonialDoc = ITestimonial & {
    _id: Types.ObjectId;
    photo?: PopulatedFile | null;
    project?: PopulatedProject | null;
  };

  const docs = (await Testimonial.find(query)
    .select("+email +submittedIp")
    .populate("photo", "url alt width height")
    .populate("project", "title slug")
    .sort(sortOption)
    .lean()) as unknown as TestimonialDoc[];

  const testimonials: AdminTestimonialItem[] = docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    role: doc.role || undefined,
    business: doc.business || undefined,
    email: doc.email,
    quote: doc.quote,
    consent: doc.consent,
    status: doc.status,
    featured: Boolean(doc.featured),
    position: typeof doc.position === "number" ? doc.position : undefined,
    submittedIp: doc.submittedIp || undefined,
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    photo: doc.photo
      ? {
          id: String(doc.photo._id),
          url: doc.photo.url,
          alt: doc.photo.alt,
          width: doc.photo.width || 120,
          height: doc.photo.height || 120,
        }
      : null,
    project: doc.project
      ? {
          id: String(doc.project._id),
          title: doc.project.title,
          slug: doc.project.slug,
        }
      : null,
  }));

  return {
    testimonials,
    counts: {
      pending: pendingCount,
      published: publishedCount,
      rejected: rejectedCount,
      all: pendingCount + publishedCount + rejectedCount,
    },
  };
}

/**
 * Returns list of projects for linking testimonials to specific case studies.
 */
export async function getAvailableProjectsForLinking(): Promise<AvailableProject[]> {
  await requireAdmin();
  await dbConnect();

  const projects = await Project.find()
    .select("title slug")
    .sort({ title: 1 })
    .lean<{ _id: Types.ObjectId; title: string; slug: string }[]>();

  return projects.map((p) => ({
    id: String(p._id),
    title: p.title,
    slug: p.slug,
  }));
}

/**
 * Publishes a testimonial (optionally featuring it on the home page).
 */
export async function publishTestimonial(
  id: string,
  featured = false,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  await dbConnect();

  const testimonial = await Testimonial.findById(id).select("+email");
  if (!testimonial) {
    return { ok: false, message: "Testimonial not found." };
  }

  testimonial.status = "published";
  testimonial.featured = featured;
  testimonial.publishedAt = new Date();
  if (typeof testimonial.position !== "number") {
    testimonial.position = await topPosition(
      testimonial.constructor as typeof Testimonial,
      { status: "published" },
    );
  }

  await testimonial.save();

  revalidatePath("/");
  revalidatePath("/testimonials");
  revalidatePath("/admin/testimonials");
  revalidatePath("/admin");

  return { ok: true };
}

/**
 * Toggles the home page featured flag for a published testimonial.
 */
export async function toggleFeatureTestimonial(
  id: string,
  featured: boolean,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  await dbConnect();

  const testimonial = await Testimonial.findById(id).select("+email");
  if (!testimonial) {
    return { ok: false, message: "Testimonial not found." };
  }

  if (testimonial.status !== "published" && featured) {
    return { ok: false, message: "Only published testimonials can be featured." };
  }

  testimonial.featured = featured;
  await testimonial.save();

  revalidatePath("/");
  revalidatePath("/testimonials");
  revalidatePath("/admin/testimonials");

  return { ok: true };
}

/**
 * Rejects a testimonial.
 */
export async function rejectTestimonial(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  await dbConnect();

  const testimonial = await Testimonial.findById(id).select("+email");
  if (!testimonial) {
    return { ok: false, message: "Testimonial not found." };
  }

  testimonial.status = "rejected";
  testimonial.featured = false;
  await testimonial.save();

  revalidatePath("/");
  revalidatePath("/testimonials");
  revalidatePath("/admin/testimonials");
  revalidatePath("/admin");

  return { ok: true };
}

/**
 * Deletes a testimonial.
 */
export async function deleteTestimonial(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  await dbConnect();

  await Testimonial.findByIdAndDelete(id);

  revalidatePath("/");
  revalidatePath("/testimonials");
  revalidatePath("/admin/testimonials");
  revalidatePath("/admin");

  return { ok: true };
}

/**
 * Updates testimonial details (typo corrections, linking project, etc.)
 */
export async function updateTestimonial(
  id: string,
  data: {
    name?: string;
    role?: string;
    business?: string;
    quote?: string;
    projectId?: string | null;
    featured?: boolean;
  },
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  await dbConnect();

  const testimonial = await Testimonial.findById(id).select("+email");
  if (!testimonial) {
    return { ok: false, message: "Testimonial not found." };
  }

  if (data.name !== undefined) testimonial.name = data.name.trim();
  if (data.role !== undefined) testimonial.role = data.role.trim() || undefined;
  if (data.business !== undefined)
    testimonial.business = data.business.trim() || undefined;
  if (data.quote !== undefined) testimonial.quote = data.quote.trim();
  if (data.projectId !== undefined) {
    testimonial.project = data.projectId
      ? new Types.ObjectId(data.projectId)
      : undefined;
  }
  if (data.featured !== undefined && testimonial.status === "published") {
    testimonial.featured = data.featured;
  }

  await testimonial.save();

  revalidatePath("/");
  revalidatePath("/testimonials");
  revalidatePath("/admin/testimonials");

  return { ok: true };
}

/**
 * Reorders published testimonials.
 */
export async function reorderTestimonials(
  orderedIds: string[],
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();
  await dbConnect();

  await Promise.all(
    orderedIds.map((id, index) =>
      Testimonial.updateOne(
        { _id: new Types.ObjectId(id) },
        { $set: { position: index + 1 } },
      ),
    ),
  );

  revalidatePath("/");
  revalidatePath("/testimonials");
  revalidatePath("/admin/testimonials");

  return { ok: true };
}

/**
 * Manually creates a testimonial directly from Admin.
 */
export async function createTestimonialMyself(data: {
  name: string;
  role?: string;
  business?: string;
  email: string;
  quote: string;
  photoId?: string;
  projectId?: string;
  status: "pending" | "published";
  featured?: boolean;
}): Promise<{ ok: boolean; id?: string; message?: string }> {
  await requireAdmin();
  await dbConnect();

  const doc = new Testimonial({
    name: data.name.trim(),
    role: data.role?.trim() || undefined,
    business: data.business?.trim() || undefined,
    email: data.email.toLowerCase().trim(),
    quote: data.quote.trim(),
    consent: true,
    photo: data.photoId ? new Types.ObjectId(data.photoId) : undefined,
    project: data.projectId ? new Types.ObjectId(data.projectId) : undefined,
    status: data.status,
    featured: data.status === "published" ? Boolean(data.featured) : false,
    publishedAt: data.status === "published" ? new Date() : undefined,
  });

  if (data.status === "published") {
    doc.position = await topPosition(Testimonial, { status: "published" });
  }

  await doc.save();

  revalidatePath("/");
  revalidatePath("/testimonials");
  revalidatePath("/admin/testimonials");
  revalidatePath("/admin");

  return { ok: true, id: String(doc._id) };
}
