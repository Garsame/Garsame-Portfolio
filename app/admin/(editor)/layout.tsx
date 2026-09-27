import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";

/**
 * Full-width editors, without the sidebar — design/28-admin-project-editor.html
 * draws the editor on its own, with a back link in its top bar.
 *
 * Outside (panel), so the sidebar layout does not wrap it. The auth check is
 * the same: here, and again in every page and data function (lib/dal.ts).
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}
