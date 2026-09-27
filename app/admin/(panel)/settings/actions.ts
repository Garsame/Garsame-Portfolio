"use server";

import { adminOrNull } from "@/lib/dal";
import {
  changeAdminPassword,
  saveSettingsData,
  testSmtpConnection,
  type SaveSettingsPayload,
} from "@/lib/admin/settings";

export async function saveSettingsAction(
  payload: SaveSettingsPayload,
): Promise<{ success: boolean; error?: string }> {
  const admin = await adminOrNull();
  if (!admin) return { success: false, error: "Not signed in." };
  return saveSettingsData(payload);
}

export async function testSmtpAction(config?: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  fromEmail: string;
}): Promise<{ success: boolean; message: string }> {
  const admin = await adminOrNull();
  if (!admin) return { success: false, message: "Not signed in." };
  return testSmtpConnection(config);
}

export async function changePasswordAction(
  currentPass: string,
  newPass: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = await adminOrNull();
  if (!admin) return { success: false, error: "Not signed in." };
  return changeAdminPassword(currentPass, newPass);
}
