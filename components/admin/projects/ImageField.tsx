"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Input } from "@/components/ui";
import type { ImageView } from "@/lib/project-view";
import { cn } from "@/lib/utils";
import { TrashIcon, UploadIcon } from "../icons";

/**
 * One image: upload, replace, remove, and its alt text.
 *
 * Uploads go to /api/admin/uploads, which checks the real type and size on the
 * server (lib/uploads.ts). The size check here only saves a slow upload that
 * would be refused anyway. Choosing from files already uploaded arrives with
 * the Files module in Phase 9.
 */

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 10 * 1024 * 1024;

export async function uploadImage(file: File): Promise<ImageView> {
  if (file.size > MAX_BYTES) throw new Error("Images can be at most 10MB.");
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as {
    image?: ImageView;
    error?: string;
  };
  if (!res.ok || !data.image) {
    throw new Error(
      data.error ??
        (res.status === 401
          ? "Your session has ended. Sign in again in another tab, then retry."
          : "The image could not be uploaded."),
    );
  }
  return data.image;
}

export function ImageField({
  image,
  onChange,
  label,
  error,
  compact = false,
}: {
  image: ImageView | null;
  onChange: (image: ImageView | null) => void;
  label: string;
  error?: string;
  /** Hide the alt text field — for a caller that shows it elsewhere. */
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const altId = useId();
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      setUploadError(
        e instanceof Error ? e.message : "The image could not be uploaded.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const shownError = uploadError ?? error;

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "flex items-center gap-2.75 rounded-input border bg-field p-2.5",
          shownError ? "border-danger" : "border-border",
        )}
      >
        <span className="flex h-9 w-13 shrink-0 items-center justify-center overflow-hidden rounded-chip bg-accent-soft">
          {image ? (
            <Image
              src={image.url}
              width={image.width}
              height={image.height}
              alt=""
              sizes="52px"
              unoptimized={image.mimeType === "image/svg+xml"}
              className="h-full w-full object-cover"
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-mono-meta font-regular tracking-none text-ink-body">
          {busy ? "Uploading…" : image ? image.name : "No image yet"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => choose(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label={
            image
              ? `Replace ${label.toLowerCase()}`
              : `Upload ${label.toLowerCase()}`
          }
          className="flex min-h-11 items-center gap-1.5 rounded-input px-2 text-fine font-semibold text-blue transition-button hover:text-blue-hover disabled:opacity-50"
        >
          <UploadIcon size={14} />
          {image ? "Replace" : "Upload"}
        </button>
        {image ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={busy}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="flex size-11 items-center justify-center rounded-input text-muted transition-button hover:text-danger disabled:opacity-50"
          >
            <TrashIcon size={14} />
          </button>
        ) : null}
      </div>

      {shownError ? (
        <p role="alert" className="text-fine text-danger">
          {shownError}
        </p>
      ) : null}

      {image && !compact ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={altId} className="text-fine font-semibold text-ink-3">
            Alt text
          </label>
          <Input
            id={altId}
            size="sm"
            tone="field"
            value={image.alt}
            maxLength={300}
            placeholder="What the image shows, for someone who cannot see it"
            onChange={(e) => onChange({ ...image, alt: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
