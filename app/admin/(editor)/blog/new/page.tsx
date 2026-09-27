import type { Metadata } from "next";
import { BlogEditor } from "@/components/admin/blog/BlogEditor";
import { getNewPostData } from "@/lib/admin/blog";
import { requireAdmin } from "@/lib/dal";
import { saveBlogAction } from "../actions";

export const metadata: Metadata = { title: "New post" };

type Props = { searchParams: Promise<{ template?: string }> };

export default async function NewPostPage({ searchParams }: Props) {
  await requireAdmin();
  const { template } = await searchParams;
  const data = await getNewPostData(template);

  return (
    <BlogEditor
      initialForm={data.form}
      initialMeta={data.meta}
      onSaveAction={saveBlogAction}
    />
  );
}
