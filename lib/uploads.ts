import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { dbConnect } from "@/lib/db";
import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_BYTES,
  StoredFile,
} from "@/models";

/**
 * File & image uploads — docs/04-ADMIN.md §9 and docs/05-DATA-MODEL.md.
 *
 * Accepts jpg, png, webp, svg, pdf up to 10MB.
 *
 * What is checked on the server before anything is written:
 *   - the size, against MAX_UPLOAD_BYTES (10MB)
 *   - the real type, from the file's magic bytes — never the uploader's claimed type
 *   - SVG safety: rejection of scripts and event handlers to prevent stored XSS
 *   - pixel dimensions for raster images (JPEG, PNG, WebP), which next/image needs
 *
 * Stored under randomized UUID names outside `public/`, served by app/uploads/[file]/route.ts.
 */

export const UPLOAD_URL_PREFIX = "/uploads";

export type AcceptedExt = "jpg" | "png" | "webp" | "svg" | "pdf";
export type AcceptedMime = (typeof ACCEPTED_MIME_TYPES)[number];

export type FileKind = {
  mime: AcceptedMime;
  ext: AcceptedExt;
  width?: number;
  height?: number;
};

/** The stored filename pattern — also the route's allow-list. */
export const STORED_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|svg|pdf)$/;

export function uploadDir(): string {
  /* turbopackIgnore: the directory is configuration, not a module to bundle */
  return path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.UPLOAD_DIR || "./uploads",
  );
}

export function maxUploadBytes(): number {
  const configured = Number(process.env.MAX_UPLOAD_BYTES);
  return Number.isFinite(configured) && configured > 0
    ? Math.min(configured, MAX_FILE_BYTES)
    : MAX_FILE_BYTES;
}

const MAX_SIDE = 20_000;

const valid = (w: number, h: number) =>
  w > 0 && h > 0 && w <= MAX_SIDE && h <= MAX_SIDE;

function jpegSize(b: Buffer): { width: number; height: number } | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const length = b.readUInt16BE(i + 2);
    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isFrame) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    if (length < 2) return null;
    i += 2 + length;
  }
  return null;
}

function webpSize(b: Buffer): { width: number; height: number } | null {
  if (b.length < 30) return null;
  const chunk = b.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    return {
      width: b.readUInt16LE(26) & 0x3fff,
      height: b.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    if (b[20] !== 0x2f) return null;
    const b1 = b[21];
    const b2 = b[22];
    const b3 = b[23];
    const b4 = b[24];
    return {
      width: 1 + (((b2 & 0x3f) << 8) | b1),
      height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
    };
  }
  if (chunk === "VP8X") {
    return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  }
  return null;
}

function sniffSvg(b: Buffer): FileKind | null {
  const text = b.toString("utf8").trim();
  /* Quick check for svg tag or xml root */
  if (!text.includes("<svg") && !text.includes("<?xml")) return null;
  if (!text.includes("<svg") || !text.includes("</svg>")) return null;

  /* Security: reject script tags and inline event handlers to prevent XSS */
  const lower = text.toLowerCase();
  if (
    lower.includes("<script") ||
    lower.includes("</script>") ||
    lower.includes("javascript:") ||
    /\son[a-z]+\s*=/i.test(lower)
  ) {
    return null;
  }

  /* Optional: parse width and height from attributes */
  let width: number | undefined;
  let height: number | undefined;
  const wMatch = text.match(/width=["'](\d+(?:\.\d+)?)(?:px)?["']/);
  const hMatch = text.match(/height=["'](\d+(?:\.\d+)?)(?:px)?["']/);
  if (wMatch && hMatch) {
    const w = parseFloat(wMatch[1]);
    const h = parseFloat(hMatch[1]);
    if (valid(w, h)) {
      width = Math.round(w);
      height = Math.round(h);
    }
  }

  return {
    mime: "image/svg+xml",
    ext: "svg",
    width,
    height,
  };
}

function sniffPdf(b: Buffer): FileKind | null {
  if (b.length >= 5 && b.subarray(0, 5).toString("ascii") === "%PDF-") {
    return {
      mime: "application/pdf",
      ext: "pdf",
    };
  }
  return null;
}

/** Sniff real type and dimensions from file bytes. */
export function sniffFile(b: Buffer): FileKind | null {
  if (
    b.length >= 24 &&
    b.readUInt32BE(0) === 0x89504e47 &&
    b.readUInt32BE(4) === 0x0d0a1a0a
  ) {
    if (b.toString("ascii", 12, 16) !== "IHDR") return null;
    const w = b.readUInt32BE(16);
    const h = b.readUInt32BE(20);
    if (!valid(w, h)) return null;
    return { mime: "image/png", ext: "png", width: w, height: h };
  }

  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    const size = jpegSize(b);
    if (!size || !valid(size.width, size.height)) return null;
    return { mime: "image/jpeg", ext: "jpg", ...size };
  }

  if (
    b.length >= 16 &&
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  ) {
    const size = webpSize(b);
    if (!size || !valid(size.width, size.height)) return null;
    return { mime: "image/webp", ext: "webp", ...size };
  }

  const pdf = sniffPdf(b);
  if (pdf) return pdf;

  const svg = sniffSvg(b);
  if (svg) return svg;

  return null;
}

/** The uploader's filename, for display only: no path, no control characters. */
export function sanitizeDisplayName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\x00-\x1f\x7f]/g, "").trim();
  return (cleaned || "file").slice(0, 200);
}

export type StoredFileView = {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  mimeType: AcceptedMime;
  size: number;
  width?: number;
  height?: number;
  alt: string;
  usedByCount: number;
  createdAt: string;
};

export type StoredImage = {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  name: string;
  mimeType: string;
};

export class UploadError extends Error {}

/** Check, store and record one uploaded file (image or document). */
export async function storeFile(file: File): Promise<StoredFileView> {
  const limit = maxUploadBytes();
  if (file.size === 0) throw new UploadError("That file is empty.");
  if (file.size > limit) {
    throw new UploadError(
      `Files can be at most ${Math.floor(limit / (1024 * 1024))}MB.`,
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffFile(bytes);
  if (!kind) {
    throw new UploadError(
      "Accepted formats are JPG, PNG, WebP, SVG and PDF. Files containing executable scripts are rejected.",
    );
  }

  const filename = `${randomUUID()}.${kind.ext}`;
  const dir = uploadDir();
  const target = path.join(/* turbopackIgnore: true */ dir, filename);

  await mkdir(/* turbopackIgnore: true */ dir, { recursive: true });
  await writeFile(/* turbopackIgnore: true */ target, bytes, { flag: "wx" });

  try {
    await dbConnect();
    const doc = await StoredFile.create({
      filename,
      originalName: sanitizeDisplayName(file.name),
      mimeType: kind.mime,
      size: bytes.length,
      width: kind.width,
      height: kind.height,
      url: `${UPLOAD_URL_PREFIX}/${filename}`,
      alt: "",
    });

    return {
      id: String(doc._id),
      url: doc.url,
      filename: doc.filename,
      originalName: doc.originalName,
      mimeType: doc.mimeType as AcceptedMime,
      size: doc.size,
      width: doc.width,
      height: doc.height,
      alt: doc.alt ?? "",
      usedByCount: doc.usedBy?.length ?? 0,
      createdAt: doc.createdAt.toISOString(),
    };
  } catch (error) {
    await unlink(target).catch(() => {});
    throw error;
  }
}

/** Check, store and record one image (backwards compatibility). */
export async function storeImage(file: File): Promise<StoredImage> {
  const stored = await storeFile(file);
  return {
    id: stored.id,
    url: stored.url,
    width: stored.width ?? 0,
    height: stored.height ?? 0,
    alt: stored.alt,
    name: stored.originalName,
    mimeType: stored.mimeType,
  };
}
