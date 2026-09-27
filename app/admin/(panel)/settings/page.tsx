import type { Metadata } from "next";
import { SettingsEditor } from "@/components/admin/settings/SettingsEditor";
import { getSettingsData } from "@/lib/admin/settings";

export const metadata: Metadata = {
  title: "Settings · Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const data = await getSettingsData();
  return <SettingsEditor initialData={data} />;
}
