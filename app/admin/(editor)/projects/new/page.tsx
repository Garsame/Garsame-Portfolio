import type { Metadata } from "next";
import { ProjectEditor } from "@/components/admin/projects/ProjectEditor";
import { getNewProjectData } from "@/lib/admin/projects";
import { requireAdmin } from "@/lib/dal";

/**
 * A new project. Nothing is created until the first save, so opening this
 * page and leaving does not leave an empty draft behind.
 */

export const metadata: Metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireAdmin();
  const data = await getNewProjectData();

  return (
    <ProjectEditor
      initialForm={data.form}
      initialMeta={data.meta}
      testimonials={data.testimonials}
    />
  );
}
