"use server";

import { savePost, deletePost } from "@/lib/admin/blog";
import type { BlogPayload } from "@/lib/blog-form";

export async function saveBlogAction(payload: BlogPayload) {
  return savePost(payload);
}

export async function deleteBlogAction(id: string) {
  return deletePost(id);
}
