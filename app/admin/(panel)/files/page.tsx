import type { Metadata } from "next";
import { FilesManager } from "@/components/admin/files/FilesManager";
import { getFileStats, listAdminFiles } from "@/lib/admin/files";

export const metadata: Metadata = {
  title: "Files · Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminFilesPage() {
  const [files, stats] = await Promise.all([
    listAdminFiles(),
    getFileStats(),
  ]);

  return <FilesManager initialFiles={files} initialStats={stats} />;
}
