"use server";

import { submitTestimonial, type TestimonialSubmitPayload } from "@/lib/testimonials-submit";
import { storeFile } from "@/lib/uploads";

export async function submitTestimonialAction(payload: TestimonialSubmitPayload) {
  return await submitTestimonial(payload);
}

export async function uploadTestimonialPhotoAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "No image file provided." };
  }
  try {
    const stored = await storeFile(file);
    return { success: true, file: stored };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload photo.",
    };
  }
}
