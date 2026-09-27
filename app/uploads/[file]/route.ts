import { readFile } from "node:fs/promises";
import path from "node:path";
import { STORED_NAME, uploadDir } from "@/lib/uploads";

/**
 * GET /uploads/<name> — serves an uploaded file (image or document).
 *
 * Only names matching the strict UUID pattern with allowed extensions are served.
 * The MIME type comes from the extension verified at upload time.
 * nosniff stops browsers from executing SVGs or content in unsafe contexts.
 */

const TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
} as const;

type Props = { params: Promise<{ file: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { file } = await params;
  if (!STORED_NAME.test(file)) {
    return new Response("Not found", { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(path.join(uploadDir(), file));
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const ext = file.split(".").pop() as keyof typeof TYPES;
  const contentType = TYPES[ext] || "application/octet-stream";

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
