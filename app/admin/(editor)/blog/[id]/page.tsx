import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogEditor } from "@/components/admin/blog/BlogEditor";
import { getPostEditorData } from "@/lib/admin/blog";
import { requireAdmin } from "@/lib/dal";
import { deleteBlogAction, saveBlogAction } from "../actions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await getPostEditorData(id);
  return { title: data?.form.title ? `Edit: ${data.form.title}` : "Edit post" };
}

export default async function EditPostPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const data = await getPostEditorData(id);
  if (!data) notFound();

  return (
    <BlogEditor
      initialForm={data.form}
      initialMeta={data.meta}
      onSaveAction={saveBlogAction}
      onDeleteAction={deleteBlogAction}
    />
  );
}
