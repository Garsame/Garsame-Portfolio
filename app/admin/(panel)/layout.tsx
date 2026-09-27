import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSidebarCounts } from "@/lib/admin/dashboard";
import { requireAdmin } from "@/lib/dal";
import { signOutAction } from "./actions";

/**
 * The admin frame for every module. /admin/login sits outside this group, in
 * (auth), so it gets no sidebar.
 *
 * requireAdmin() here fetches the admin for the sidebar. It is not the auth
 * check the pages rely on — each page and each data function calls it again
 * (cached, so it costs one lookup per request). A layout does not re-run on
 * client navigation and does not stop the page beneath it rendering.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [admin, counts] = await Promise.all([
    requireAdmin(),
    getSidebarCounts(),
  ]);

  return (
    <AdminShell
      admin={{ name: admin.name, email: admin.email }}
      counts={counts}
      signOut={signOutAction}
    >
      {children}
    </AdminShell>
  );
}
