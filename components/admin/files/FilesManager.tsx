"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { LockIcon, SearchIcon, UploadIcon } from "../icons";
import { FileInspectorModal } from "./FileInspectorModal";
import type { AdminFileItem, AdminFileStats, AdminFileTab } from "@/lib/admin/files";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  initialFiles: AdminFileItem[];
  initialStats: AdminFileStats;
};

export function FilesManager({ initialFiles, initialStats }: Props) {
  const [files, setFiles] = useState<AdminFileItem[]>(initialFiles);
  const [stats, setStats] = useState<AdminFileStats>(initialStats);
  const [activeTab, setActiveTab] = useState<AdminFileTab>("all");
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<AdminFileItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchId = useId();

  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const list = Array.from(fileList);
    if (list.length === 0) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    for (const f of list) {
      formData.append("files", f);
    }

    try {
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed. Try again.");
      } else {
        // Refresh to show newly uploaded files with correct database IDs
        window.location.reload();
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // Client-side filtered list
  const filteredFiles = files.filter((f) => {
    if (activeTab === "images" && f.mimeType === "application/pdf") return false;
    if (activeTab === "documents" && f.mimeType !== "application/pdf") return false;
    if (activeTab === "unused" && f.usedByCount > 0) return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = f.originalName.toLowerCase().includes(q);
      const matchFilename = f.filename.toLowerCase().includes(q);
      const matchAlt = (f.alt || "").toLowerCase().includes(q);
      if (!matchName && !matchFilename && !matchAlt) return false;
    }

    return true;
  });

  return (
    <div className="flex flex-1 flex-col gap-5 p-7">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-display-sm font-bold text-ink">Files</h1>
          <span className="font-mono text-caption text-muted">
            {stats.totalCount} files · {formatBytes(stats.totalBytes)} used
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab((curr) => (curr === "unused" ? "all" : "unused"))}
            className={activeTab === "unused" ? "border-blue text-blue font-semibold" : ""}
          >
            Find unused
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUploadFiles(e.target.files);
            }}
          />

          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <UploadIcon className="h-3.5 w-3.5" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-full px-4 py-2 text-small font-medium transition-colors ${
              activeTab === "all"
                ? "bg-blue font-semibold text-white shadow-xs"
                : "border border-border bg-white text-ink-muted hover:border-blue hover:text-blue"
            }`}
          >
            All · {stats.totalCount}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`rounded-full px-4 py-2 text-small font-medium transition-colors ${
              activeTab === "images"
                ? "bg-blue font-semibold text-white shadow-xs"
                : "border border-border bg-white text-ink-muted hover:border-blue hover:text-blue"
            }`}
          >
            Images · {stats.imagesCount}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`rounded-full px-4 py-2 text-small font-medium transition-colors ${
              activeTab === "documents"
                ? "bg-blue font-semibold text-white shadow-xs"
                : "border border-border bg-white text-ink-muted hover:border-blue hover:text-blue"
            }`}
          >
            Documents · {stats.documentsCount}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("unused")}
            className={`rounded-full px-4 py-2 text-small font-medium transition-colors ${
              activeTab === "unused"
                ? "bg-blue font-semibold text-white shadow-xs"
                : "border border-border bg-white text-ink-muted hover:border-blue hover:text-blue"
            }`}
          >
            Unused · {stats.unusedCount}
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <label htmlFor={searchId} className="sr-only">
            Search files
          </label>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full rounded-input border border-border bg-white py-2 pl-9 pr-3.5 text-small text-ink placeholder:text-muted focus:border-blue focus:outline-none"
          />
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-center gap-3 rounded-card border-2 border-dashed p-5 transition-colors ${
          dragOver
            ? "border-blue bg-blue-wash/30"
            : "border-[#C9D2F7] bg-[#F8FAFF] hover:border-blue hover:bg-blue-wash/10"
        }`}
      >
        <UploadIcon className="h-5 w-5 text-[#8C9CE4]" />
        <span className="text-small text-[#64708F]">
          Drop files here — images are converted to webp and thumbnailed automatically · 10 MB per file
        </span>
      </div>

      {uploadError && (
        <div className="rounded-card border border-red-200 bg-red-50 p-3 text-caption text-red-600">
          {uploadError}
        </div>
      )}

      {/* Grid of Files */}
      {filteredFiles.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-card border border-border bg-white p-8 text-center">
          <p className="text-body font-semibold text-ink">No files found</p>
          <p className="text-caption text-muted">
            {search ? "No files match your search criteria." : "Upload your first image or PDF document to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filteredFiles.map((file) => {
            const inUse = file.usedByCount > 0;
            const isImage = file.mimeType.startsWith("image/");
            const isPdf = file.mimeType === "application/pdf";

            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`group flex flex-col overflow-hidden rounded-card border text-left transition-all hover:shadow-card-hover ${
                  inUse ? "border-border bg-white" : "border-[#E8D9BE] bg-white"
                }`}
              >
                {/* Thumbnail Tile */}
                <div
                  className={`relative flex h-28 w-full items-center justify-center overflow-hidden ${
                    inUse ? (isPdf ? "bg-[#F1F4FD]" : "bg-[#EDF0FE]") : "bg-[#FBF1E3]"
                  }`}
                >
                  {isImage ? (
                    <div className="relative h-full w-full p-2">
                      <Image
                        src={file.url}
                        alt={file.alt || file.originalName}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                        className="object-contain transition-transform group-hover:scale-105"
                        unoptimized={file.mimeType === "image/svg+xml"}
                      />
                    </div>
                  ) : isPdf ? (
                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7D89AE"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  ) : (
                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#A8B6EE"
                      strokeWidth="1.4"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <circle cx="8" cy="10" r="2" />
                      <path d="M2 17l6-5 5 4 3-3 6 5" />
                    </svg>
                  )}
                </div>

                {/* File info */}
                <div className="flex flex-col gap-1 p-3">
                  <span
                    className="font-mono text-[11px] font-medium text-ink truncate"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </span>
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted">
                    <span>{formatBytes(file.size)}</span>
                    <span
                      className={`font-semibold ${
                        inUse ? "text-success" : "text-warning"
                      }`}
                    >
                      {inUse ? "in use" : "unused"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom info notice */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-white px-5 py-4">
        <div className="flex items-center gap-3 text-small text-ink-muted">
          <LockIcon className="h-4 w-4 text-blue" />
          <span>
            A file that is used by a post or a project cannot be deleted until it is removed from there first.
          </span>
        </div>
        <span className="font-mono text-caption text-muted">
          {formatBytes(stats.totalBytes)} of storage used
        </span>
      </div>

      {/* Inspector Modal */}
      {selectedFile && (
        <FileInspectorModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onUpdated={() => {
            setSelectedFile(null);
            window.location.reload();
          }}
          onDeleted={(deletedId) => {
            setFiles((curr) => curr.filter((f) => f.id !== deletedId));
            setStats((curr) => ({
              ...curr,
              totalCount: curr.totalCount - 1,
            }));
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
}
