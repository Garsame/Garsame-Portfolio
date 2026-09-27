"use server";

import { reorderProjects, setProjectFeatured } from "@/lib/admin/projects";

/**
 * Server Actions for the projects list. Each checks the admin itself — an
 * action is a public endpoint whoever renders the button — and Next.js checks
 * the request's origin. The rules live in lib/admin/projects.ts and the model.
 */

export async function reorderProjectsAction(ids: string[]) {
  return reorderProjects(ids);
}

export async function setProjectFeaturedAction(id: string, featured: boolean) {
  return setProjectFeatured(id, featured);
}
