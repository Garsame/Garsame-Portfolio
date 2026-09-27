import type { Metadata } from "next";
import { AdminContent, TopBar } from "@/components/admin/TopBar";
import { BlogList } from "@/components/admin/blog/BlogList";
import { NewPostButton } from "./NewPostButton";
import { listAdminPosts } from "@/lib/admin/blog";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  await requireAdmin();
  const { posts, counts } = await listAdminPosts();

  return (
    <>
      <TopBar
        title="Blog"
        subtitle={`${counts.published} published · ${counts.draft} drafts · ${counts.scheduled} scheduled`}
        actions={<NewPostButton />}
      />
      <AdminContent>
        <BlogList initialPosts={posts} counts={counts} />
      </AdminContent>
    </>
  );
}
