"use server";

import { adminOrNull } from "@/lib/dal";
import { saveBrandingData, type SaveBrandingPayload } from "@/lib/admin/branding";

export async function saveBrandingAction(
  payload: SaveBrandingPayload,
): Promise<{ success: boolean; error?: string }> {
  const admin = await adminOrNull();
  if (!admin) {
    return { success: false, error: "Not signed in." };
  }
  return saveBrandingData(payload);
}
