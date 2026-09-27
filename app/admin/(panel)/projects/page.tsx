import type { Metadata } from "next";
import { Button, Plus } from "@/components/ui";
import { AdminContent, TopBar } from "@/components/admin/TopBar";
import { ProjectList } from "@/components/admin/projects/ProjectList";
import { MAX_FEATURED_PROJECTS, listAdminProjects } from "@/lib/admin/projects";
import { requireAdmin } from "@/lib/dal";

/**
 * Projects — docs/04-ADMIN.md §5, design/27-admin-projects-list.html.
 */

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  await requireAdmin();
  const projects = await listAdminProjects();
  const featured = projects.filter((p) => p.featured).length;

  return (
    <>
      <TopBar
        title="Projects"
        subtitle={`${projects.length} total · ${featured} featured · drag to reorder`}
        actions={
          <Button
            href="/admin/projects/new"
            size="xs"
            icon={<Plus size={14} strokeWidth={2.2} />}
          >
            New project
          </Button>
        }
      />
      <AdminContent>
        <ProjectList initial={projects} maxFeatured={MAX_FEATURED_PROJECTS} />
      </AdminContent>
    </>
  );
}
