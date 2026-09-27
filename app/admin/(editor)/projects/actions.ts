"use server";

import { saveProject } from "@/lib/admin/projects";
import type { ProjectPayload } from "@/lib/project-form";

/**
 * Save, publish, unpublish, archive or restore a project. The admin is checked
 * and every field validated in lib/admin/projects.ts; the payload type here is
 * what the editor sends, not something the server relies on.
 */
export async function saveProjectAction(payload: ProjectPayload) {
  return saveProject(payload);
}
