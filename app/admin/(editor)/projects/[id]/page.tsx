import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/projects/ProjectEditor";
import { getProjectEditorData } from "@/lib/admin/projects";
import { requireAdmin } from "@/lib/dal";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getProjectEditorData(id);
  return { title: data ? `Edit ${data.form.title}` : "Not found" };
}

export default async function EditProjectPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const data = await getProjectEditorData(id);
  if (!data) notFound();

  /* Keyed by id, so moving from one project to another starts a fresh form. */
  return (
    <ProjectEditor
      key={data.form.id}
      initialForm={data.form}
      initialMeta={data.meta}
      testimonials={data.testimonials}
    />
  );
}
