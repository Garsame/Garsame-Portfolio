"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { StateBadge } from "@/components/admin/StateBadge";
import { BlockEditor } from "@/components/admin/editor/BlockEditor";
import { ImageField } from "@/components/admin/projects/ImageField";
import { BlogPreviewOverlay } from "@/components/admin/blog/BlogPreviewOverlay";
import { PostArt } from "@/components/site/icons";
import { readingTime, tableOfContents, type EditorNode } from "@/lib/editor-content";
import { isEditorDoc } from "@/lib/editor-content";
import type { BlogForm, BlogMeta, BlogPayload } from "@/lib/blog-form";
import {
  POST_CATEGORIES,
  POST_CATEGORY_LABELS,
  POST_EXCERPT_MAX,
  POST_SEO_DESCRIPTION_MAX,
  POST_SEO_TITLE_MAX,
  POST_TITLE_MAX,
  type PostCategory,
} from "@/lib/blog-rules";
import type { SaveIntent } from "@/lib/project-form";
import type { BlogPostDetailView } from "@/lib/blog";

export function BlogEditor({
  initialForm,
  initialMeta,
  onSaveAction,
  onDeleteAction,
}: {
  initialForm: BlogForm;
  initialMeta: BlogMeta;
  onSaveAction: (payload: BlogPayload) => Promise<{
    ok: boolean;
    id?: string;
    meta?: BlogMeta;
    errors?: Record<string, string>;
    message?: string;
    notice?: string;
  }>;
  onDeleteAction?: (id: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<BlogForm>(initialForm);
  const [meta, setMeta] = useState<BlogMeta>(initialMeta);
  const [activeTab, setActiveTab] = useState<"post" | "seo">("post");
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  const isNew = !form.id;

  // Track if slug was edited manually
  const slugManualRef = useRef(Boolean(form.slug && !isNew));

  // Compute reading time live for previews
  const liveReadingTime = form.body ? readingTime(form.body) : 1;

  const updateField = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugManualRef.current && isNew) {
        next.slug = (value as string)
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 80);
      }
      return next;
    });
    setSaveStatus("unsaved");
  };

  const handleSave = useCallback((intent: SaveIntent = "save") => {
    setSaveStatus("saving");
    setErrors({});
    setNotice(null);

    const payload: BlogPayload = {
      id: form.id,
      intent,
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      coverId: form.cover?.id ?? null,
      category: form.category,
      tags: form.tags,
      body: form.body,
      featured: form.featured,
      series: form.series,
      scheduledFor: form.scheduledFor ? form.scheduledFor : null,
      seoTitle: form.seoTitle,
      seoDescription: form.seoDescription,
      alts: form.cover ? [{ id: form.cover.id, alt: form.cover.alt }] : [],
    };

    startTransition(async () => {
      const res = await onSaveAction(payload);
      if (res.ok && res.id && res.meta) {
        setForm((prev) => ({ ...prev, id: res.id ?? prev.id }));
        setMeta(res.meta);
        setSaveStatus("saved");
        if (res.notice) setNotice(res.notice);

        if (isNew && res.id) {
          router.replace(`/admin/blog/${res.id}`);
        }
      } else {
        setSaveStatus("unsaved");
        if (res.errors) setErrors(res.errors);
        if (res.message) setNotice(res.message);
      }
    });
  }, [form, isNew, onSaveAction, router]);

  // Debounced Autosave for existing posts
  useEffect(() => {
    if (isNew || saveStatus !== "unsaved") return;

    const timer = setTimeout(() => {
      handleSave("save");
    }, 2500);

    return () => clearTimeout(timer);
  }, [form, isNew, saveStatus, handleSave]);

  // Preview data projection
  const previewPost: BlogPostDetailView = {
    id: form.id || "preview",
    slug: form.slug || "preview-post",
    number: 12,
    title: form.title || "Untitled post",
    excerpt: form.excerpt,
    cover: form.cover,
    category: (form.category || "technology") as PostCategory,
    tags: form.tags,
    body: isEditorDoc(form.body) ? form.body : null,
    publishedAt: meta.publishedAt || new Date().toISOString(),
    readingTime: liveReadingTime,
    toc: form.body ? tableOfContents(form.body) : [],
    views: meta.views,
    series: form.series,
    seoTitle: form.seoTitle,
    seoDescription: form.seoDescription,
  };

  // Check publish readiness
  const missingRequirements: string[] = [];
  if (!form.title.trim()) missingRequirements.push("A title is required.");
  if (!form.excerpt.trim()) missingRequirements.push("An excerpt is required.");
  if (!form.cover) missingRequirements.push("A cover image is required.");
  if (!form.category) missingRequirements.push("A category is required.");
  if (!form.body) missingRequirements.push("The post has no content yet.");

  return (
    <div className="flex min-h-screen flex-col bg-field text-ink">
      {/* ----------------------------------------------------- Top Bar */}
      <header className="sticky top-0 z-30 flex min-h-[64px] flex-wrap items-center justify-between gap-4 border-b border-border bg-white px-4 py-2 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            className="flex items-center gap-1.5 text-small font-semibold text-ink-3 hover:text-blue"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Blog
          </Link>
          <span className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <StateBadge state={meta.state} scheduled={Boolean(meta.scheduledFor)} />
            <span className="font-mono text-mono-meta text-muted">
              {saveStatus === "saving"
                ? "Saving…"
                : saveStatus === "saved"
                  ? "All changes saved"
                  : "Unsaved changes"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setShowPreview(true)}
          >
            Preview page
          </Button>

          {meta.state === "published" ? (
            <>
              <Button
                size="xs"
                variant="secondary"
                disabled={isPending}
                onClick={() => handleSave("unpublish")}
              >
                Unpublish
              </Button>
              <Button
                size="xs"
                disabled={isPending}
                onClick={() => handleSave("save")}
              >
                Save
              </Button>
            </>
          ) : form.scheduledFor ? (
            <Button
              size="xs"
              disabled={isPending}
              onClick={() => handleSave("save")}
            >
              Schedule
            </Button>
          ) : (
            <>
              <Button
                size="xs"
                variant="secondary"
                disabled={isPending}
                onClick={() => handleSave("save")}
              >
                Save draft
              </Button>
              <Button
                size="xs"
                disabled={isPending}
                onClick={() => handleSave("publish")}
              >
                Publish
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`border-b px-6 py-2.5 text-small font-medium ${
            errors && Object.keys(errors).length > 0
              ? "border-warning/20 bg-warning-bg text-warning"
              : "border-success/20 bg-success-bg text-success"
          }`}
        >
          {notice}
        </div>
      )}

      {/* ------------------------------------------------ Main Content Grid */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_330px]">
        {/* Canvas / Editor Column */}
        <div className="flex justify-center overflow-y-auto px-4 py-8 sm:px-8">
          <div className="flex w-full max-w-[720px] flex-col gap-6">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Post title"
                maxLength={POST_TITLE_MAX}
                className="w-full bg-transparent text-display font-extrabold tracking-tight text-ink placeholder:text-muted focus:outline-none"
              />
              {errors.title && (
                <span className="font-mono text-mono-meta text-danger">
                  {errors.title}
                </span>
              )}
            </div>

            {/* TipTap Block Editor */}
            <div className="min-h-[400px]">
              <BlockEditor
                value={form.body}
                onChange={(doc: EditorNode | null) => updateField("body", doc)}
                label="Post body"
                placeholder="Start writing or type / for blocks…"
              />
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- Right Rail */}
        <aside className="border-t border-border bg-white p-5 lg:border-t-0 lg:border-l">
          {/* Tab selector */}
          <div className="flex rounded-[9px] bg-field p-1">
            <button
              type="button"
              onClick={() => setActiveTab("post")}
              className={`flex-1 rounded-[7px] py-1.5 text-small font-semibold transition-colors ${
                activeTab === "post"
                  ? "bg-white text-blue shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Post
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seo")}
              className={`flex-1 rounded-[7px] py-1.5 text-small font-semibold transition-colors ${
                activeTab === "seo"
                  ? "bg-white text-blue shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              SEO
            </button>
          </div>

          {activeTab === "post" ? (
            <div className="mt-5 flex flex-col gap-5">
              {/* Slug */}
              <div className="flex flex-col gap-1.5">
                <label className="text-fine font-semibold text-ink-3">Slug</label>
                <Input
                  size="sm"
                  tone="field"
                  value={form.slug}
                  onChange={(e) => {
                    slugManualRef.current = true;
                    updateField("slug", e.target.value);
                  }}
                  placeholder="post-slug"
                  error={errors.slug}
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-fine font-semibold text-ink-3">Category</label>
                <Select
                  size="sm"
                  tone="field"
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value as PostCategory)}
                  error={errors.category}
                >
                  {POST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {POST_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Excerpt */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-fine font-semibold text-ink-3">Excerpt</label>
                  <span className="font-mono text-[10px] text-muted">
                    {form.excerpt.length} / {POST_EXCERPT_MAX}
                  </span>
                </div>
                <Textarea
                  size="sm"
                  tone="field"
                  rows={3}
                  value={form.excerpt}
                  maxLength={POST_EXCERPT_MAX}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  placeholder="Short summary for cards and search results…"
                  error={errors.excerpt}
                />
              </div>

              {/* Card Preview */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
                  CARD PREVIEW
                </span>
                <div className="overflow-hidden rounded-card border border-border bg-white shadow-xs">
                  <div className="relative flex h-[88px] items-center justify-center bg-accent-soft">
                    <span className="absolute top-2 left-2 font-mono text-[10px] font-semibold text-blue">
                      # 012
                    </span>
                    <PostArt index={0} className="text-placeholder-line" />
                  </div>
                  <div className="flex flex-col gap-1.5 p-3.5">
                    <span className="font-mono text-[9px] tracking-wide text-blue uppercase">
                      {POST_CATEGORY_LABELS[form.category || "technology"]}
                    </span>
                    <span className="line-clamp-2 text-small font-bold text-ink">
                      {form.title || "Post title preview"}
                    </span>
                    <p className="line-clamp-2 text-caption text-ink-body">
                      {form.excerpt || "Excerpt preview text…"}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-muted">
                      <span>Today</span>
                      <span>·</span>
                      <span>{liveReadingTime} min</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
                  COVER IMAGE
                </span>
                <ImageField
                  image={form.cover}
                  onChange={(img) => updateField("cover", img)}
                  label="Cover image"
                  error={errors.coverImage}
                  compact
                />
              </div>

              {/* Featured toggle */}
              <label className="flex cursor-pointer items-center justify-between rounded-input border border-border bg-field p-3">
                <div className="flex flex-col">
                  <span className="text-small font-bold text-ink">Featured post</span>
                  <span className="text-fine text-ink-body">
                    Appears large at the top of /blog
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => updateField("featured", e.target.checked)}
                  className="size-4 accent-blue"
                />
              </label>

              {/* Schedule For (if draft) */}
              {meta.state !== "published" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-fine font-semibold text-ink-3">
                    Schedule publish for later (optional)
                  </label>
                  <Input
                    type="datetime-local"
                    size="sm"
                    tone="field"
                    value={
                      form.scheduledFor
                        ? new Date(form.scheduledFor).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      updateField(
                        "scheduledFor",
                        e.target.value ? new Date(e.target.value).toISOString() : "",
                      )
                    }
                    error={errors.scheduledFor}
                  />
                </div>
              )}

              {/* Publish Readiness Blockers */}
              {missingRequirements.length > 0 && meta.state === "draft" && (
                <div className="rounded-input border border-warning/30 bg-warning-bg p-3.5 text-warning">
                  <div className="text-small font-bold">Cannot publish yet</div>
                  <ul className="mt-1 list-disc pl-4 text-fine leading-relaxed">
                    {missingRequirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Delete button (if existing) */}
              {!isNew && onDeleteAction && (
                <div className="pt-4">
                  <Button
                    variant="danger"
                    size="sm"
                    block
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this post?")) {
                        await onDeleteAction(form.id!);
                        router.push("/admin/blog");
                      }
                    }}
                  >
                    Delete post
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-fine font-semibold text-ink-3">
                  SEO Title
                </label>
                <Input
                  size="sm"
                  tone="field"
                  value={form.seoTitle}
                  maxLength={POST_SEO_TITLE_MAX}
                  onChange={(e) => updateField("seoTitle", e.target.value)}
                  placeholder="Custom title for search engines"
                  error={errors.seoTitle}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-fine font-semibold text-ink-3">
                  SEO Description
                </label>
                <Textarea
                  size="sm"
                  tone="field"
                  rows={3}
                  value={form.seoDescription}
                  maxLength={POST_SEO_DESCRIPTION_MAX}
                  onChange={(e) => updateField("seoDescription", e.target.value)}
                  placeholder="Meta description for search engines"
                  error={errors.seoDescription}
                />
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Full Page Preview Modal */}
      {showPreview && (
        <BlogPreviewOverlay
          post={previewPost}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
