import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { adminOrNull } from "@/lib/dal";
import { sameOrigin } from "@/lib/request";
import {
  UploadError,
  maxUploadBytes,
  storeFile,
  type StoredFileView,
} from "@/lib/uploads";

/**
 * POST /api/admin/uploads — accepts one or more files up to 10MB each.
 *
 * Checks origin and database admin session, verifies magic bytes, and stores
 * files safely with random UUID filenames.
 */

const ENVELOPE_BYTES = 128 * 1024;

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  if (!(await adminOrNull())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const declared = Number(request.headers.get("content-length"));
  if (declared > (maxUploadBytes() + ENVELOPE_BYTES) * 10) {
    return NextResponse.json(
      {
        error: `Upload batch exceeds limit. Maximum file size is ${Math.floor(maxUploadBytes() / (1024 * 1024))}MB.`,
      },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "That upload could not be read. Try again." },
      { status: 400 },
    );
  }

  const files: File[] = [];
  for (const entry of formData.getAll("file")) {
    if (entry instanceof File && entry.size > 0) files.push(entry);
  }
  for (const entry of formData.getAll("files")) {
    if (entry instanceof File && entry.size > 0) files.push(entry);
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  const stored: StoredFileView[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const res = await storeFile(file);
      stored.push(res);
    } catch (err) {
      if (err instanceof UploadError) {
        errors.push(`${file.name}: ${err.message}`);
      } else {
        console.error("[uploads]", err);
        errors.push(`${file.name}: Could not be saved.`);
      }
    }
  }

  if (stored.length > 0) {
    try {
      revalidatePath("/admin/files");
    } catch {
      /* ignore in route context */
    }
  }

  if (stored.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const first = stored[0];
  return NextResponse.json(
    {
      file: first,
      /* backwards compatibility for ImageField */
      image: first
        ? {
            id: first.id,
            url: first.url,
            width: first.width ?? 0,
            height: first.height ?? 0,
            alt: first.alt,
            name: first.originalName,
            mimeType: first.mimeType,
          }
        : null,
      files: stored,
      errors: errors.length > 0 ? errors : undefined,
    },
    { status: 201 },
  );
}
