import type { Metadata } from "next";
import { BrandingEditor } from "@/components/admin/branding/BrandingEditor";
import { getBrandingData } from "@/lib/admin/branding";

export const metadata: Metadata = {
  title: "Branding & Look · Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminBrandingPage() {
  const data = await getBrandingData();
  return <BrandingEditor initialData={data} />;
}
