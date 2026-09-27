"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui";
import type {
  AdminTestimonialItem,
  AvailableProject,
} from "@/lib/admin/testimonials";
import {
  createTestimonialAction,
  deleteTestimonialAction,
  publishTestimonialAction,
  rejectTestimonialAction,
  reorderTestimonialsAction,
  toggleFeatureAction,
  updateTestimonialAction,
} from "@/app/admin/(panel)/testimonials/actions";
import { TestimonialEditModal } from "./TestimonialEditModal";
import { cn } from "@/lib/utils";

export function TestimonialsManager({
  initialTestimonials,
  counts: initialCounts,
  projects,
}: {
  initialTestimonials: AdminTestimonialItem[];
  counts: { pending: number; published: number; rejected: number; all: number };
  projects: AvailableProject[];
}) {
  const [testimonials, setTestimonials] =
    useState<AdminTestimonialItem[]>(initialTestimonials);
  const [counts, setCounts] = useState(initialCounts);
  const [tab, setTab] = useState<"pending" | "published" | "rejected">(
    initialCounts.pending > 0 ? "pending" : "published",
  );

  const [copiedLink, setCopiedLink] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminTestimonialItem | null | undefined>(
    undefined,
  ); // undefined = closed, null = create new, item = edit item

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/testimonials#submit`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePublish = (id: string, featured = false) => {
    startTransition(async () => {
      const res = await publishTestimonialAction(id, featured);
      if (res.ok) {
        setTestimonials((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, status: "published", featured, publishedAt: new Date().toISOString() }
              : t,
          ),
        );
        setCounts((c) => ({
          ...c,
          pending: Math.max(0, c.pending - 1),
          published: c.published + 1,
        }));
      }
    });
  };

  const handleReject = (id: string) => {
    startTransition(async () => {
      const res = await rejectTestimonialAction(id);
      if (res.ok) {
        setTestimonials((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, status: "rejected", featured: false } : t,
          ),
        );
        setCounts((c) => ({
          ...c,
          pending: tab === "pending" ? Math.max(0, c.pending - 1) : c.pending,
          published: tab === "published" ? Math.max(0, c.published - 1) : c.published,
          rejected: c.rejected + 1,
        }));
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this testimonial?")) {
      return;
    }
    startTransition(async () => {
      const res = await deleteTestimonialAction(id);
      if (res.ok) {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
        setCounts((c) => ({
          ...c,
          [tab]: Math.max(0, c[tab] - 1),
          all: Math.max(0, c.all - 1),
        }));
      }
    });
  };

  const handleToggleFeature = (id: string, featured: boolean) => {
    startTransition(async () => {
      const res = await toggleFeatureAction(id, featured);
      if (res.ok) {
        setTestimonials((prev) =>
          prev.map((t) => (t.id === id ? { ...t, featured } : t)),
        );
      }
    });
  };

  const handleModalSave = async (data: {
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
  }) => {
    if (data.id) {
      // Edit existing
      const res = await updateTestimonialAction(data.id, {
        name: data.name,
        role: data.role,
        business: data.business,
        quote: data.quote,
        projectId: data.projectId,
        featured: data.featured,
      });
      if (res.ok) {
        const linkedProj = projects.find((p) => p.id === data.projectId);
        setTestimonials((prev) =>
          prev.map((t) =>
            t.id === data.id
              ? {
                  ...t,
                  name: data.name,
                  role: data.role,
                  business: data.business,
                  quote: data.quote,
                  featured: Boolean(data.featured),
                  project: linkedProj
                    ? { id: linkedProj.id, title: linkedProj.title, slug: linkedProj.slug }
                    : null,
                }
              : t,
          ),
        );
      }
      return res;
    } else {
      // Create new
      const res = await createTestimonialAction({
        name: data.name,
        role: data.role,
        business: data.business,
        email: data.email || "manual@garsame.so",
        quote: data.quote,
        photoId: data.photoId,
        projectId: data.projectId || undefined,
        status: data.status || "published",
        featured: data.featured,
      });
      if (res.ok && res.id) {
        const linkedProj = projects.find((p) => p.id === data.projectId);
        const newItem: AdminTestimonialItem = {
          id: res.id,
          name: data.name,
          role: data.role,
          business: data.business,
          email: data.email || "manual@garsame.so",
          quote: data.quote,
          consent: true,
          status: data.status || "published",
          featured: Boolean(data.featured),
          createdAt: new Date().toISOString(),
          photo: data.photoUrl
            ? { id: data.photoId || "", url: data.photoUrl, width: 120, height: 120 }
            : null,
          project: linkedProj
            ? { id: linkedProj.id, title: linkedProj.title, slug: linkedProj.slug }
            : null,
        };
        setTestimonials((prev) => [newItem, ...prev]);
        setCounts((c) => ({
          ...c,
          [newItem.status]: c[newItem.status] + 1,
          all: c.all + 1,
        }));
      }
      return res;
    }
  };

  // Drag and drop reordering for published items
  const publishedList = testimonials.filter((t) => t.status === "published");

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updated = [...publishedList];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, moved);

    setDraggedIndex(index);

    // Merge into full state
    const nonPublished = testimonials.filter((t) => t.status !== "published");
    setTestimonials([...updated, ...nonPublished]);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    const orderedIds = publishedList.map((t) => t.id);
    startTransition(async () => {
      await reorderTestimonialsAction(orderedIds);
    });
  };

  const filtered = testimonials.filter((t) => t.status === tab);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={cn(
              "rounded-full px-4 py-2 text-small font-semibold transition-button",
              tab === "pending"
                ? "bg-[#B4690E] text-white shadow-xs"
                : "border border-border bg-white text-ink-body hover:bg-tint",
            )}
          >
            Pending · {counts.pending}
          </button>
          <button
            type="button"
            onClick={() => setTab("published")}
            className={cn(
              "rounded-full px-4 py-2 text-small font-semibold transition-button",
              tab === "published"
                ? "bg-blue text-white shadow-xs"
                : "border border-border bg-white text-ink-body hover:bg-tint",
            )}
          >
            Published · {counts.published}
          </button>
          <button
            type="button"
            onClick={() => setTab("rejected")}
            className={cn(
              "rounded-full px-4 py-2 text-small font-semibold transition-button",
              tab === "rejected"
                ? "bg-ink text-white shadow-xs"
                : "border border-border bg-white text-ink-body hover:bg-tint",
            )}
          >
            Rejected · {counts.rejected}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopyLink}
          >
            {copiedLink ? "✓ Link Copied!" : "Copy submission link"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setEditingItem(null)}
          >
            Add one myself
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------ Tab: Pending */}
      {tab === "pending" && (
        <div className="flex flex-col gap-4">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-6 rounded-card border border-[#E8D9BE] border-l-4 border-l-[#B4690E] bg-white p-6 shadow-card lg:grid-cols-[56px_1fr_210px] items-start"
              >
                {/* Photo / Avatar */}
                {item.photo ? (
                  <div className="relative size-14 overflow-hidden rounded-full border border-border">
                    <Image
                      src={item.photo.url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="size-14 rounded-full bg-[#DDE3FA] flex items-center justify-center font-bold text-blue text-body-lg">
                    {item.name.slice(0, 2).toUpperCase()}
                  </span>
                )}

                {/* Body Content */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-body-lg font-bold text-ink">
                      {item.name}
                    </span>
                    <span className="font-mono text-mono-chip font-bold text-[#B4690E] bg-[#FBF1E3] px-2 py-0.5 rounded-sm uppercase tracking-wide">
                      Pending
                    </span>
                    <span className="font-mono text-mono-meta text-muted">
                      {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-body">
                    {item.role && <span>{item.role}</span>}
                    {item.role && item.business && <span>·</span>}
                    {item.business && (
                      <span className="font-semibold">{item.business}</span>
                    )}
                    <span>·</span>
                    <span className="font-mono text-mono-meta text-muted">
                      {item.email} (private)
                    </span>
                  </div>

                  {item.project && (
                    <div className="flex items-center gap-1.5 font-mono text-mono-meta text-blue">
                      <span>Linked project:</span>
                      <span className="font-semibold">{item.project.title}</span>
                    </div>
                  )}

                  <div className="rounded-card bg-[#F8FAFF] border border-border p-4 text-[15px] leading-[1.7] text-ink-3 italic">
                    &quot;{item.quote}&quot;
                  </div>

                  <div className="flex items-center gap-2 text-small text-ink-body pt-1">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1A7F4B"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    >
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                    <span>Consented to publication with name and business</span>
                  </div>
                </div>

                {/* Actions Column */}
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="xs"
                    onClick={() => handlePublish(item.id, false)}
                    disabled={isPending}
                  >
                    Publish
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => handlePublish(item.id, true)}
                    disabled={isPending}
                  >
                    Publish &amp; feature
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => setEditingItem(item)}
                    disabled={isPending}
                  >
                    Edit typo
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => setEditingItem(item)}
                    disabled={isPending}
                  >
                    Link to project
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="xs"
                    onClick={() => handleReject(item.id)}
                    disabled={isPending}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-card border border-border bg-white p-12 text-center">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7D89AE"
                strokeWidth="1.5"
                className="mb-3"
              >
                <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
              </svg>
              <h3 className="text-body-lg font-bold text-ink">
                No pending testimonials
              </h3>
              <p className="mt-1 max-w-sm text-small text-ink-body">
                New submissions from clients will appear here for review and publication.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ Tab: Published */}
      {tab === "published" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <span className="flex-1 h-px bg-border" />
            <span className="font-mono text-mono-chip tracking-wider text-muted uppercase">
              PUBLISHED — DRAG TO REORDER
            </span>
            <span className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publishedList.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card transition-all cursor-move",
                  draggedIndex === index && "opacity-50 scale-98 border-blue",
                )}
              >
                {/* Header with state & drag handle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.featured ? (
                      <span className="font-mono text-mono-chip font-bold text-blue bg-[#EDF0FE] px-2 py-0.5 rounded-sm uppercase tracking-wide">
                        Featured
                      </span>
                    ) : (
                      <span className="font-mono text-mono-chip font-bold text-[#1A7F4B] bg-[#E6F5ED] px-2 py-0.5 rounded-sm uppercase tracking-wide">
                        Published
                      </span>
                    )}
                    {item.project && (
                      <span className="font-mono text-[10px] text-muted truncate max-w-[120px]">
                        {item.project.title}
                      </span>
                    )}
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#97A2C0"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
                  </svg>
                </div>

                {/* Quote */}
                <p className="line-clamp-4 text-[13px] leading-[1.65] text-ink-3">
                  &quot;{item.quote}&quot;
                </p>

                {/* Submitter */}
                <div className="mt-auto flex items-center gap-2.5 pt-2 border-t border-border/60">
                  {item.photo ? (
                    <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-border">
                      <Image
                        src={item.photo.url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <span className="size-8 shrink-0 rounded-full bg-[#DDE3FA] flex items-center justify-center font-bold text-blue text-caption">
                      {item.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-small font-bold text-ink truncate">
                      {item.name}
                    </span>
                    <span className="font-mono text-[11px] text-muted truncate">
                      {[item.role, item.business].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                </div>

                {/* Quick actions bar */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40 font-mono text-mono-meta">
                  <button
                    type="button"
                    onClick={() => handleToggleFeature(item.id, !item.featured)}
                    className="text-blue hover:underline"
                  >
                    {item.featured ? "Unfeature" : "Feature"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="text-ink-body hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(item.id)}
                      className="text-[#C0342B] hover:underline"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* If fewer than 3 published, show prompt card */}
            {publishedList.length < 3 && (
              <div className="flex min-h-[190px] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-[#C9D2F7] bg-[#F8FAFF] p-6 text-center">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8C9CE4"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="text-small font-bold text-ink-3">
                  {3 - publishedList.length} more to fill the home row
                </span>
                <span className="text-[12px] leading-relaxed text-[#8C9CE4]">
                  Send the submission link to a client
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ Tab: Rejected */}
      {tab === "rejected" && (
        <div className="flex flex-col gap-4">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-card border border-border bg-white p-6 shadow-card md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-col gap-1.5 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="text-body font-bold text-ink">
                      {item.name}
                    </span>
                    <span className="font-mono text-mono-chip text-[#C0342B] bg-[#FBEAE9] px-2 py-0.5 rounded-sm uppercase">
                      Rejected
                    </span>
                    <span className="font-mono text-mono-meta text-muted">
                      {[item.role, item.business].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                  <p className="text-small text-ink-body line-clamp-2 italic">
                    &quot;{item.quote}&quot;
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => handlePublish(item.id, false)}
                    disabled={isPending}
                  >
                    Publish
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => setEditingItem(item)}
                    disabled={isPending}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="xs"
                    onClick={() => handleDelete(item.id)}
                    disabled={isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-card border border-border bg-white p-12 text-center">
              <h3 className="text-body font-bold text-ink">No rejected testimonials</h3>
            </div>
          )}
        </div>
      )}

      {/* Edit / Create Modal */}
      {editingItem !== undefined && (
        <TestimonialEditModal
          isOpen={true}
          onClose={() => setEditingItem(undefined)}
          testimonial={editingItem}
          projects={projects}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
