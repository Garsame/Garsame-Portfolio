"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { listMediaFilesAction } from "@/app/admin/(panel)/files/actions";
import { SearchIcon, UploadIcon } from "./icons";
import type { AdminFileItem } from "@/lib/admin/files";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (file: { id: string; url: string; originalName: string; alt?: string }) => void;
  accept?: "images" | "documents" | "all";
  title?: string;
};

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  accept = "images",
  title = "Select from Media Library",
}: Props) {
  const [files, setFiles] = useState<AdminFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    if (open) {
      listMediaFilesAction({
        tab: accept === "images" ? "images" : accept === "documents" ? "documents" : "all",
        search: search.trim() || undefined,
      }).then((res) => {
        if (mounted) {
          setLoading(false);
          if (res.files) {
            setFiles(res.files);
          }
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [open, accept, search]);

  if (!open) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed.");
      } else if (data.file) {
        onSelect({
          id: data.file.id,
          url: data.file.url,
          originalName: data.file.originalName,
          alt: data.file.alt,
        });
        onClose();
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const selectedFile = files.find((f) => f.id === selectedId);

  const handleConfirmSelect = () => {
    if (selectedFile) {
      onSelect({
        id: selectedFile.id,
        url: selectedFile.url,
        originalName: selectedFile.originalName,
        alt: selectedFile.alt,
      });
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-card border border-border bg-white shadow-card-hover overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="media-picker-title" className="text-body font-bold text-ink">
            {title}
          </h2>
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

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-tint/40 px-6 py-3">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full rounded-input border border-border bg-white py-1.5 pl-8 pr-3 text-caption text-ink placeholder:text-muted focus:border-blue focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept={
                accept === "documents"
                  ? "application/pdf"
                  : accept === "images"
                  ? "image/jpeg,image/png,image/webp,image/svg+xml"
                  : "image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
              }
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <UploadIcon className="h-3.5 w-3.5" />
              {uploading ? "Uploading..." : "Upload New"}
            </Button>
          </div>
        </div>

        {uploadError && (
          <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-caption text-red-600">
            {uploadError}
          </div>
        )}

        {/* Grid Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[260px] max-h-[420px]">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-caption text-muted">
              Loading media files...
            </div>
          ) : files.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-caption text-muted">
              <p>No files found.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload one now
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {files.map((file) => {
                const isSelected = file.id === selectedId;
                const isImage = file.mimeType.startsWith("image/");

                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setSelectedId(file.id)}
                    onDoubleClick={() => {
                      setSelectedId(file.id);
                      onSelect({
                        id: file.id,
                        url: file.url,
                        originalName: file.originalName,
                        alt: file.alt,
                      });
                      onClose();
                    }}
                    className={`group flex flex-col overflow-hidden rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-blue ring-2 ring-blue/30 shadow-card"
                        : "border-border hover:border-blue/50"
                    }`}
                  >
                    <div className="relative flex h-24 w-full items-center justify-center bg-tint/60">
                      {isImage ? (
                        <div className="relative h-full w-full p-1.5">
                          <Image
                            src={file.url}
                            alt={file.alt || file.originalName}
                            fill
                            sizes="120px"
                            className="object-contain"
                            unoptimized={file.mimeType === "image/svg+xml"}
                          />
                        </div>
                      ) : (
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#7D89AE"
                          strokeWidth="1.5"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      )}
                    </div>
                    <div className="p-2">
                      <span className="font-mono text-[10px] text-ink truncate block" title={file.originalName}>
                        {file.originalName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-tint/30 px-6 py-3.5">
          <span className="font-mono text-caption text-muted">
            {selectedFile ? `Selected: ${selectedFile.originalName}` : "Choose a file"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmSelect}
              disabled={!selectedId}
            >
              Select
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
