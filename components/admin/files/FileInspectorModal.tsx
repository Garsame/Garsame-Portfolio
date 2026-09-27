"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import {
  deleteFileAction,
  getFileDetailsAction,
  replaceFileAction,
  updateFileAction,
} from "@/app/admin/(panel)/files/actions";
import type { AdminFileDetail, AdminFileItem } from "@/lib/admin/files";
import { CopyIcon, TrashIcon, UploadIcon, LockIcon } from "../icons";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  file: AdminFileItem | null;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: (id: string) => void;
};

export function FileInspectorModal({
  file,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const [details, setDetails] = useState<AdminFileDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [originalName, setOriginalName] = useState(file?.originalName ?? "");
  const [alt, setAlt] = useState(file?.alt ?? "");
  const [error, setError] = useState<string | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const replaceInputRef = useRef<HTMLInputElement>(null);

  const fileId = file?.id;

  useEffect(() => {
    let mounted = true;
    if (fileId) {
      getFileDetailsAction(fileId).then((res) => {
        if (mounted) {
          setLoading(false);
          if (res.file) {
            setDetails(res.file);
            setOriginalName(res.file.originalName);
            setAlt(res.file.alt || "");
          }
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [fileId]);

  if (!file) return null;

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";
  const inUse = (details?.usedByCount ?? file.usedByCount) > 0;

  const handleCopyUrl = async () => {
    const fullUrl = `${window.location.origin}${file.url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateFileAction(file.id, { originalName, alt });
      if (!res.success) {
        setError(res.error ?? "Could not update file.");
      } else {
        onUpdated();
      }
    });
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${file.originalName}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteFileAction(file.id);
      if (!res.success) {
        setError(res.error ?? "Could not delete file.");
      } else {
        onDeleted(file.id);
        onClose();
      }
    });
  };

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = e.target.files?.[0];
    if (!newFile) return;

    setReplaceError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", newFile);
      const res = await replaceFileAction(file.id, formData);
      if (!res.success) {
        setReplaceError(res.error ?? "Could not replace file.");
      } else {
        onUpdated();
        /* Reload details */
        const fresh = await getFileDetailsAction(file.id);
        if (fresh.file) setDetails(fresh.file);
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-card border border-border bg-white shadow-card-hover overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <h2 id="inspector-title" className="text-body font-bold text-ink truncate max-w-md">
              {file.originalName}
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                inUse
                  ? "bg-[#E6F5ED] text-success"
                  : "bg-[#FEF3E4] text-warning"
              }`}
            >
              {inUse ? "in use" : "unused"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-button p-1.5 text-muted hover:bg-tint hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Preview Box */}
          <div className="flex h-56 w-full items-center justify-center rounded-lg border border-border bg-tint/60 p-4 relative overflow-hidden">
            {isImage ? (
              <div className="relative h-full w-full">
                <Image
                  src={file.url}
                  alt={file.alt || file.originalName}
                  fill
                  sizes="600px"
                  className="object-contain"
                  unoptimized={file.mimeType === "image/svg+xml"}
                />
              </div>
            ) : isPdf ? (
              <div className="flex flex-col items-center gap-2 text-muted">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span className="font-mono text-small">PDF Document</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 17l6-5 5 4 3-3 6 5" />
                </svg>
                <span className="font-mono text-small">{file.mimeType}</span>
              </div>
            )}
          </div>

          {/* Details & Copy Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-tint/40 p-3 text-small">
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-caption text-ink-muted">
              <span>Size: <strong className="text-ink">{formatBytes(file.size)}</strong></span>
              {file.width && file.height && (
                <span>Dimensions: <strong className="text-ink">{file.width} × {file.height}px</strong></span>
              )}
              <span>Type: <strong className="text-ink">{file.mimeType}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyUrl}
                disabled={copied}
                className="text-caption"
              >
                <CopyIcon className="h-3.5 w-3.5" />
                {copied ? "Copied URL!" : "Copy URL"}
              </Button>
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-caption text-blue hover:underline"
              >
                Open in new tab ↗
              </a>
            </div>
          </div>

          {/* Form Fields: Rename & Alt */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-semibold text-ink-muted">
                Display Name
              </label>
              <Input
                value={originalName}
                onChange={(e) => setOriginalName(e.target.value)}
                placeholder="filename.webp"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-semibold text-ink-muted">
                Alt Text (for accessibility & SEO)
              </label>
              <Input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Descriptive image context"
              />
            </div>
          </div>

          {/* Used By References */}
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-caption font-semibold uppercase tracking-wider text-ink-muted">
                Referenced In ({details?.usedByDetails.length ?? file.usedByCount})
              </span>
              {inUse && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-muted">
                  <LockIcon className="h-3 w-3 text-muted" /> Protected from deletion
                </span>
              )}
            </div>

            {loading ? (
              <p className="text-caption text-muted">Loading references...</p>
            ) : details?.usedByDetails && details.usedByDetails.length > 0 ? (
              <div className="flex flex-col gap-2">
                {details.usedByDetails.map((ref, idx) => (
                  <div
                    key={`${ref.model}-${ref.id}-${idx}`}
                    className="flex items-center justify-between rounded border border-border bg-tint/30 px-3 py-2 text-small"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-blue border border-border">
                        {ref.model}
                      </span>
                      <span className="font-medium text-ink truncate max-w-xs">{ref.title}</span>
                    </div>
                    {ref.url && (
                      <Link
                        href={ref.url}
                        className="font-mono text-caption text-blue hover:underline"
                        onClick={onClose}
                      >
                        Edit {ref.model} →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-caption text-muted">
                This file is not currently referenced by any post, project, or site settings. It is safe to delete.
              </p>
            )}
          </div>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 p-3 text-caption text-red-600">
              {error}
            </p>
          )}

          {replaceError && (
            <p className="rounded border border-red-200 bg-red-50 p-3 text-caption text-red-600">
              {replaceError}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border bg-tint/30 px-6 py-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={replaceInputRef}
              onChange={handleReplace}
              className="hidden"
              accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => replaceInputRef.current?.click()}
              disabled={isPending}
            >
              <UploadIcon className="h-3.5 w-3.5" />
              Replace File
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isPending || inUse}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
