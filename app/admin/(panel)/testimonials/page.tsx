import type { Metadata } from "next";
import { AdminContent, TopBar } from "@/components/admin/TopBar";
import { requireAdmin } from "@/lib/dal";
import {
  getAdminTestimonials,
  getAvailableProjectsForLinking,
} from "@/lib/admin/testimonials";
import { TestimonialsManager } from "@/components/admin/testimonials/TestimonialsManager";

export const metadata: Metadata = {
  title: "Testimonials",
};

export default async function AdminTestimonialsPage() {
  await requireAdmin();

  const [{ testimonials, counts }, projects] = await Promise.all([
    getAdminTestimonials(),
    getAvailableProjectsForLinking(),
  ]);

  const subtitle = `${counts.pending} pending · ${counts.published} published · ${counts.rejected} rejected`;

  return (
    <>
      <TopBar title="Testimonials" subtitle={subtitle} />
      <AdminContent>
        <TestimonialsManager
          initialTestimonials={testimonials}
          counts={counts}
          projects={projects}
        />
      </AdminContent>
    </>
  );
}
