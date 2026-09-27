"use client";

import { useState, useTransition } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import type {
  AdminTestimonialItem,
  AvailableProject,
} from "@/lib/admin/testimonials";
import Image from "next/image";

export type TestimonialEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  testimonial?: AdminTestimonialItem | null;
  projects: AvailableProject[];
  onSave: (data: {
    id?: string;
    name: string;
    role?: string;
    business?: string;
    email?: string;
    quote: string;
    projectId?: string | null;
    photoId?: string;
    photoUrl?: string;
    featured?: boolean;
    status?: "pending" | "published";
  }) => Promise<{ ok: boolean; message?: string }>;
};

export function TestimonialEditModal({
  isOpen,
  onClose,
  testimonial,
  projects,
  onSave,
}: TestimonialEditModalProps) {
  const isEditing = Boolean(testimonial);

  const [name, setName] = useState(testimonial?.name || "");
  const [role, setRole] = useState(testimonial?.role || "");
  const [business, setBusiness] = useState(testimonial?.business || "");
  const [email, setEmail] = useState(testimonial?.email || "");
  const [quote, setQuote] = useState(testimonial?.quote || "");
  const [projectId, setProjectId] = useState<string>(
    testimonial?.project?.id || "",
  );
  const [featured, setFeatured] = useState(testimonial?.featured || false);
  const [status, setStatus] = useState<"pending" | "published">(
    testimonial?.status === "published" ? "published" : "pending",
  );

  const [photoId, setPhotoId] = useState<string | undefined>(
    testimonial?.photo?.id,
  );
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(
    testimonial?.photo?.url,
  );
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide the person's name.");
      return;
    }
    if (!quote.trim()) {
      setError("Please provide the testimonial quote text.");
      return;
    }
    if (!isEditing && !email.trim()) {
      setError("Please provide an email address for verification.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await onSave({
        id: testimonial?.id,
        name: name.trim(),
        role: role.trim() || undefined,
        business: business.trim() || undefined,
        email: email.trim() || undefined,
        quote: quote.trim(),
        projectId: projectId || null,
        photoId,
        photoUrl,
        featured,
        status,
      });

      if (res.ok) {
        onClose();
      } else {
        setError(res.message || "Failed to save testimonial.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-card border border-border bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-h3 text-ink">
              {isEditing ? "Edit Testimonial" : "Add Testimonial Myself"}
            </h3>
            <p className="font-mono text-mono-meta text-muted">
              {isEditing
                ? "Correct minor typos or link to a project without altering meaning."
                : "Enter a direct client quote manually into the database."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-btn text-muted hover:bg-tint hover:text-ink transition-button"
            aria-label="Close modal"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto p-6">
          {error && (
            <div className="rounded-btn bg-[#FDF0EE] p-3 text-small text-[#C0342B] border border-[#F0C9C6]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-small font-semibold text-ink">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ibrahim Ahmed Abdirahman"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-small font-semibold text-ink">
                Private Email {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ibrahim@heelan.so"
                disabled={isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-small font-semibold text-ink">
                Role / Title
              </label>
              <Input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Project Manager"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-small font-semibold text-ink">
                Business / Organization
              </label>
              <Input
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                placeholder="e.g. Heelan Home Health Care"
              />
            </div>
          </div>

          {/* Photo / Avatar */}
          <div>
            <label className="mb-1.5 block text-small font-semibold text-ink">
              Photo (Avatar)
            </label>
            <div className="flex items-center gap-4">
              {photoUrl ? (
                <div className="relative size-14 overflow-hidden rounded-full border border-border">
                  <Image
                    src={photoUrl}
                    alt={name || "Avatar"}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <span className="size-14 rounded-full bg-[#DDE3FA] flex items-center justify-center font-bold text-blue">
                  {name ? name.slice(0, 2).toUpperCase() : "G3"}
                </span>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={() => setIsMediaPickerOpen(true)}
                >
                  Choose from Files
                </Button>
                {photoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setPhotoId(undefined);
                      setPhotoUrl(undefined);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Link to Project */}
          <div>
            <label className="mb-1.5 block text-small font-semibold text-ink">
              Link to Project (Optional)
            </label>
            <Select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">No linked project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
            <span className="mt-1 block font-mono text-[11px] text-muted">
              When linked and published, this testimonial appears on the project&apos;s detail page.
            </span>
          </div>

          {/* Quote */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-small font-semibold text-ink">
                Testimonial Quote <span className="text-red-500">*</span>
              </label>
              <span className="font-mono text-mono-meta text-muted">
                {quote.length} / 600
              </span>
            </div>
            <Textarea
              rows={4}
              value={quote}
              onChange={(e) => setQuote(e.target.value.slice(0, 600))}
              placeholder="What did they say about the project, communication, and results?"
              required
            />
          </div>

          {/* Publish Options */}
          <div className="flex flex-col gap-2 rounded-btn border border-border bg-tint-soft p-3.5">
            {!isEditing && (
              <label className="flex items-center gap-2.5 text-small font-semibold text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={status === "published"}
                  onChange={(e) =>
                    setStatus(e.target.checked ? "published" : "pending")
                  }
                  className="size-4 rounded-sm border-border text-blue focus:ring-blue"
                />
                Publish immediately
              </label>
            )}

            <label className="flex items-center gap-2.5 text-small font-semibold text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                disabled={status !== "published" && !isEditing}
                onChange={(e) => setFeatured(e.target.checked)}
                className="size-4 rounded-sm border-border text-blue focus:ring-blue disabled:opacity-50"
              />
              Feature on Home Page (top social proof cards)
            </label>
          </div>

          {/* Modal Footer */}
          <div className="mt-2 flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Testimonial"}
            </Button>
          </div>
        </form>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(file) => {
          setPhotoId(file.id);
          setPhotoUrl(file.url);
          setIsMediaPickerOpen(false);
        }}
        accept="images"
      />
    </div>
  );
}
