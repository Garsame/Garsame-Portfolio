"use server";

import { revalidatePath } from "next/cache";
import { adminOrNull } from "@/lib/dal";
import {
  deleteAdminFile,
  getAdminFileDetails,
  listAdminFiles,
  replaceAdminFile,
  updateAdminFile,
  type AdminFileDetail,
  type AdminFileItem,
  type AdminFileTab,
} from "@/lib/admin/files";

async function requireAdmin() {
  const admin = await adminOrNull();
  if (!admin) throw new Error("Not signed in.");
  return admin;
}

export async function listMediaFilesAction(options?: {
  tab?: AdminFileTab;
  search?: string;
}): Promise<{ files: AdminFileItem[]; error?: string }> {
  try {
    await requireAdmin();
    const files = await listAdminFiles(options);
    return { files };
  } catch (err) {
    return {
      files: [],
      error: err instanceof Error ? err.message : "Could not list files.",
    };
  }
}

export async function getFileDetailsAction(
  id: string,
): Promise<{ file: AdminFileDetail | null; error?: string }> {
  try {
    await requireAdmin();
    const file = await getAdminFileDetails(id);
    return { file };
  } catch (err) {
    return {
      file: null,
      error: err instanceof Error ? err.message : "Could not load file details.",
    };
  }
}

export async function updateFileAction(
  id: string,
  data: { originalName?: string; alt?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const res = await updateAdminFile(id, data);
    if (res.success) {
      revalidatePath("/admin/files");
    }
    return res;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not update file.",
    };
  }
}

export async function deleteFileAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const res = await deleteAdminFile(id);
    if (res.success) {
      revalidatePath("/admin/files");
    }
    return res;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not delete file.",
    };
  }
}

export async function replaceFileAction(
  id: string,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Choose a valid file." };
    }
    const res = await replaceAdminFile(id, file);
    if (res.success) {
      revalidatePath("/admin/files");
    }
    return res;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not replace file.",
    };
  }
}
