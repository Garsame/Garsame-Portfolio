"use server";

import {
  createTestimonialMyself,
  deleteTestimonial,
  publishTestimonial,
  rejectTestimonial,
  reorderTestimonials,
  toggleFeatureTestimonial,
  updateTestimonial,
} from "@/lib/admin/testimonials";

export async function publishTestimonialAction(
  id: string,
  featured = false,
): Promise<{ ok: boolean; message?: string }> {
  try {
    return await publishTestimonial(id, featured);
  } catch (err) {
    console.error("[actions:publishTestimonialAction]", err);
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Failed to publish testimonial.",
    };
  }
}

export async function toggleFeatureAction(
  id: string,
  featured: boolean,
): Promise<{ ok: boolean; message?: string }> {
  try {
    return await toggleFeatureTestimonial(id, featured);
  } catch (err) {
    console.error("[actions:toggleFeatureAction]", err);
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Failed to update feature status.",
    };
  }
}

export async function rejectTestimonialAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    return await rejectTestimonial(id);
  } catch (err) {
    console.error("[actions:rejectTestimonialAction]", err);
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Failed to reject testimonial.",
    };
  }
}

export async function deleteTestimonialAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    return await deleteTestimonial(id);
  } catch (err) {
    console.error("[actions:deleteTestimonialAction]", err);
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Failed to delete testimonial.",
    };
  }
}

export async function updateTestimonialAction(
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
  try {
    return await updateTestimonial(id, data);
  } catch (err) {
    console.error("[actions:updateTestimonialAction]", err);
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Failed to update testimonial.",
    };
  }
}

export async function reorderTestimonialsAction(
  orderedIds: string[],
): Promise<{ ok: boolean; message?: string }> {
  try {
    return await reorderTestimonials(orderedIds);
  } catch (err) {
    console.error("[actions:reorderTestimonialsAction]", err);
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Failed to reorder testimonials.",
    };
  }
}

export async function createTestimonialAction(data: {
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
  try {
    return await createTestimonialMyself(data);
  } catch (err) {
    console.error("[actions:createTestimonialAction]", err);
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Failed to create testimonial.",
    };
  }
}
