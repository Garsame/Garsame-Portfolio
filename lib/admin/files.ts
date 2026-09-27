import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dbConnect } from "@/lib/db";
import {
  Post,
  Project,
  StoredFile,
  Testimonial,
  Broadcast,
} from "@/models";
import {
  maxUploadBytes,
  sanitizeDisplayName,
  sniffFile,
  uploadDir,
  UPLOAD_URL_PREFIX,
  type AcceptedMime,
} from "@/lib/uploads";

export type AdminFileTab = "all" | "images" | "documents" | "unused";

export type FileUsedByDetail = {
  model: string;
  id: string;
  title: string;
  url?: string;
};

export type AdminFileItem = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: AcceptedMime;
  size: number;
  width?: number;
  height?: number;
  url: string;
  thumbUrl?: string;
  alt: string;
  usedByCount: number;
  usedBy: { model: string; id: string }[];
  createdAt: string;
};

export type AdminFileDetail = AdminFileItem & {
  usedByDetails: FileUsedByDetail[];
};

export type AdminFileStats = {
  totalCount: number;
  imagesCount: number;
  documentsCount: number;
  unusedCount: number;
  totalBytes: number;
};

export async function getFileStats(): Promise<AdminFileStats> {
  await dbConnect();
  const all = await StoredFile.find({}, { mimeType: 1, size: 1, usedBy: 1 }).lean();

  let imagesCount = 0;
  let documentsCount = 0;
  let unusedCount = 0;
  let totalBytes = 0;

  for (const f of all) {
    totalBytes += f.size || 0;
    if (f.mimeType === "application/pdf") {
      documentsCount++;
    } else {
      imagesCount++;
    }
    if (!f.usedBy || f.usedBy.length === 0) {
      unusedCount++;
    }
  }

  return {
    totalCount: all.length,
    imagesCount,
    documentsCount,
    unusedCount,
    totalBytes,
  };
}

export async function listAdminFiles(options?: {
  tab?: AdminFileTab;
  search?: string;
}): Promise<AdminFileItem[]> {
  await dbConnect();

  const query: Record<string, unknown> = {};

  if (options?.tab === "images") {
    query.mimeType = { $ne: "application/pdf" };
  } else if (options?.tab === "documents") {
    query.mimeType = "application/pdf";
  } else if (options?.tab === "unused") {
    query.usedBy = { $size: 0 };
  }

  if (options?.search?.trim()) {
    const term = options.search.trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ originalName: regex }, { filename: regex }, { alt: regex }];
  }

  const files = await StoredFile.find(query).sort({ createdAt: -1 }).lean();

  return files.map((f) => ({
    id: String(f._id),
    filename: f.filename,
    originalName: f.originalName,
    mimeType: f.mimeType as AcceptedMime,
    size: f.size,
    width: f.width,
    height: f.height,
    url: f.url,
    thumbUrl: f.thumbUrl,
    alt: f.alt ?? "",
    usedByCount: f.usedBy?.length ?? 0,
    usedBy: (f.usedBy ?? []).map((u) => ({
      model: u.model,
      id: String(u.id),
    })),
    createdAt: f.createdAt ? f.createdAt.toISOString() : new Date().toISOString(),
  }));
}

export async function getAdminFileDetails(
  id: string,
): Promise<AdminFileDetail | null> {
  await dbConnect();
  const file = await StoredFile.findById(id).lean();
  if (!file) return null;

  const usedByDetails: FileUsedByDetail[] = [];

  for (const u of file.usedBy ?? []) {
    const docId = String(u.id);
    if (u.model === "Project") {
      const proj = await Project.findById(docId, { title: 1, slug: 1 }).lean();
      if (proj) {
        usedByDetails.push({
          model: "Project",
          id: docId,
          title: proj.title,
          url: `/admin/projects/${docId}`,
        });
      }
    } else if (u.model === "Post") {
      const post = await Post.findById(docId, { title: 1, slug: 1 }).lean();
      if (post) {
        usedByDetails.push({
          model: "Post",
          id: docId,
          title: post.title,
          url: `/admin/blog/${docId}`,
        });
      }
    } else if (u.model === "Settings") {
      usedByDetails.push({
        model: "Settings",
        id: docId,
        title: "Site Branding & Look",
        url: `/admin/branding`,
      });
    } else if (u.model === "Testimonial") {
      const t = await Testimonial.findById(docId, { name: 1, business: 1 }).lean();
      if (t) {
        usedByDetails.push({
          model: "Testimonial",
          id: docId,
          title: `${t.name} (${t.business})`,
          url: `/admin/testimonials`,
        });
      }
    } else if (u.model === "Broadcast") {
      const b = await Broadcast.findById(docId, { subject: 1 }).lean();
      if (b) {
        usedByDetails.push({
          model: "Broadcast",
          id: docId,
          title: b.subject || "Untitled Broadcast",
          url: `/admin/updates`,
        });
      }
    }
  }

  return {
    id: String(file._id),
    filename: file.filename,
    originalName: file.originalName,
    mimeType: file.mimeType as AcceptedMime,
    size: file.size,
    width: file.width,
    height: file.height,
    url: file.url,
    thumbUrl: file.thumbUrl,
    alt: file.alt ?? "",
    usedByCount: file.usedBy?.length ?? 0,
    usedBy: (file.usedBy ?? []).map((u) => ({
      model: u.model,
      id: String(u.id),
    })),
    usedByDetails,
    createdAt: file.createdAt
      ? file.createdAt.toISOString()
      : new Date().toISOString(),
  };
}

export async function updateAdminFile(
  id: string,
  data: { originalName?: string; alt?: string },
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();
  const file = await StoredFile.findById(id);
  if (!file) return { success: false, error: "File not found." };

  if (typeof data.originalName === "string" && data.originalName.trim()) {
    file.originalName = sanitizeDisplayName(data.originalName);
  }
  if (typeof data.alt === "string") {
    file.alt = data.alt.trim().slice(0, 300);
  }

  await file.save();
  return { success: true };
}

export async function deleteAdminFile(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await dbConnect();
  const file = await StoredFile.findById(id);
  if (!file) return { success: false, error: "File not found." };

  if (file.usedBy && file.usedBy.length > 0) {
    const usages = file.usedBy
      .map((u) => `${u.model.toLowerCase()} (${String(u.id)})`)
      .join(", ");
    return {
      success: false,
      error: `This file is currently in use by ${usages}. Remove it from there first before deleting.`,
    };
  }

  const diskPath = path.join(uploadDir(), file.filename);
  await unlink(diskPath).catch(() => {});
  await file.deleteOne();

  return { success: true };
}

export async function replaceAdminFile(
  id: string,
  file: File,
): Promise<{ success: boolean; error?: string }> {
  const limit = maxUploadBytes();
  if (file.size === 0) return { success: false, error: "The file is empty." };
  if (file.size > limit) {
    return {
      success: false,
      error: `Files can be at most ${Math.floor(limit / (1024 * 1024))}MB.`,
    };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffFile(bytes);
  if (!kind) {
    return {
      success: false,
      error: "Accepted formats are JPG, PNG, WebP, SVG and PDF. Files with executable scripts are rejected.",
    };
  }

  await dbConnect();
  const doc = await StoredFile.findById(id);
  if (!doc) return { success: false, error: "File not found." };

  const oldFilename = doc.filename;
  const newFilename = `${randomUUID()}.${kind.ext}`;
  const dir = uploadDir();
  const newPath = path.join(/* turbopackIgnore: true */ dir, newFilename);

  await mkdir(/* turbopackIgnore: true */ dir, { recursive: true });
  await writeFile(/* turbopackIgnore: true */ newPath, bytes, { flag: "wx" });

  try {
    doc.filename = newFilename;
    doc.originalName = sanitizeDisplayName(file.name);
    doc.mimeType = kind.mime;
    doc.size = bytes.length;
    doc.width = kind.width;
    doc.height = kind.height;
    doc.url = `${UPLOAD_URL_PREFIX}/${newFilename}`;
    await doc.save();

    /* Unlink old file from disk after successful db update */
    const oldPath = path.join(dir, oldFilename);
    await unlink(oldPath).catch(() => {});

    return { success: true };
  } catch (err) {
    await unlink(newPath).catch(() => {});
    throw err;
  }
}
