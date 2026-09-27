"use server";

import { submitContactMessage, type ContactSubmissionPayload } from "@/lib/contact";

export async function submitContactAction(payload: ContactSubmissionPayload) {
  return await submitContactMessage(payload);
}
