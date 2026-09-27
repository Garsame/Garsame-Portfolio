"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  Button,
  FormField,
  Input,
  Select,
  Switch,
  Textarea,
} from "@/components/ui";
import { ProjectCard } from "@/components/site/ProjectCard";
import { saveProjectAction } from "@/app/admin/(editor)/projects/actions";
import type {
  FieldErrors,
  SaveResult,
  TestimonialOption,
} from "@/lib/admin/projects";
import { wordCount } from "@/lib/editor-content";
import {
  formToCardView,
  formToDetailView,
  formToPayload,
  type ProjectForm,
  type ProjectMeta,
  type SaveIntent,
} from "@/lib/project-form";
import {
  PROJECT_SEO_DESCRIPTION_MAX,
  PROJECT_SEO_TITLE_MAX,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_SUMMARY_MAX,
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  projectPublishProblems,
  type ProjectStatusValue,
  type ProjectType,
} from "@/lib/project-rules";
import { cn } from "@/lib/utils";
import { StateBadge } from "../StateBadge";
import { ChevronLeftIcon, EyeIcon } from "../icons";
import { BlockEditor } from "../editor/BlockEditor";
import { ImageField } from "./ImageField";
import {
  CustomSections,
  FORMAT_HELP,
  OptionalBlocks,
  blockForError,
  type BlockId,
} from "./OptionalBlocks";
import { PreviewOverlay } from "./PreviewOverlay";
import { TagInput } from "./TagInput";

/**
 * The project editor — docs/04-ADMIN.md §5, design/28-admin-project-editor.html.
 *
 * Required fields, optional blocks and custom sections on the left; the card
 * preview, publishing and search settings on the right. Nothing is saved until
 * "Save changes" (or Ctrl/⌘+S); the browser warns before leaving with unsaved
 * work. Autosave arrives with the block editor in Phase 7.
 *
 * Every rule shown here is checked again on the server, which is the one that
 * decides. The "Required" badge uses the same function the model uses
 * (lib/project-rules.ts), so the two cannot disagree.
 */

type Message =
  | { tone: "error"; text: string; items: string[] }
  | { tone: "status"; text: string };

function relativeTime(iso: string | null, now: number): string {
  if (!iso) return "";
  const seconds = Math.max(
    0,
    Math.round((now - new Date(iso).getTime()) / 1000),
  );
  if (seconds < 10) return "Saved just now";
  if (seconds < 60) return `Saved ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Saved ${minutes}m ago`;
  return `Saved ${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Mogadishu",
  }).format(new Date(iso))}`;
}

const dateLabel = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Mogadishu",
      }).format(new Date(iso))
    : "Not yet";

export function ProjectEditor({
  initialForm,
  initialMeta,
  testimonials,
}: {
  initialForm: ProjectForm;
  initialMeta: ProjectMeta;
  testimonials: TestimonialOption[];
}) {
  const uid = useId();
  const [form, setForm] = useState(initialForm);
  const [meta, setMeta] = useState(initialMeta);
  const [saved, setSaved] = useState(() => JSON.stringify(initialForm));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<Message | null>(null);
  const [openBlock, setOpenBlock] = useState<BlockId | null>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(form) !== saved;
  const isNew = form.id === null;

  const set = useCallback(
    <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    [],
  );

  /* "Saved 8s ago" keeps itself current. */
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(timer);
  }, []);

  /* Warn before leaving with unsaved work. */
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const missing = useMemo(
    () =>
      projectPublishProblems({
        client: form.client,
        year: Number.parseInt(form.year, 10) || null,
        type: form.type,
        status: form.status,
        summary: form.summary,
        coverImage: form.cover?.id,
        problem: form.problem,
        body: form.body,
        stack: form.stack,
      }),
    [form],
  );
  const missingCount = Object.keys(missing).length;

  /* A new project keeps this URL after its first save. Changing the address —
     with router.replace or history.replaceState — makes Next.js re-render the
     route, which remounts this editor: the message about what is still missing
     disappears, and anything typed while the save was in flight is thrown
     away. The editor holds the saved id and keeps updating the same project;
     the back link leads to the list, where it now appears. D-077. */
  const save = useCallback(
    (intent: SaveIntent) => {
      if (pending) return;
      const submitted = form;
      startTransition(async () => {
        let result: SaveResult;
        try {
          result = await saveProjectAction(formToPayload(submitted, intent));
        } catch {
          setMessage({
            tone: "error",
            text: "The project could not be saved. Check your connection and try again.",
            items: [],
          });
          return;
        }

        const settle = (id: string, next: ProjectMeta) => {
          setMeta(next);
          const withSlug = { ...submitted, id, slug: next.slug };
          setForm((current) =>
            JSON.stringify(current) === JSON.stringify(submitted)
              ? withSlug
              : { ...current, id, slug: current.slug || next.slug },
          );
          setSaved(JSON.stringify(withSlug));
          setNow(Date.now());
        };

        if (result.ok) {
          settle(result.id, result.meta);
          setErrors({});
          setMessage({ tone: "status", text: result.notice ?? "Saved." });
          return;
        }

        if (result.saved) settle(result.saved.id, result.saved.meta);
        setErrors(result.errors);
        const items = [...new Set(Object.values(result.errors))];
        setMessage({ tone: "error", text: result.message, items });

        /* Open the first block with a problem, so it can be seen. */
        const firstBlock = Object.keys(result.errors)
          .map(blockForError)
          .find((b): b is BlockId => b !== null && b !== "sections");
        if (firstBlock) setOpenBlock(firstBlock);
        const sectionError = Object.keys(result.errors).find((k) =>
          k.startsWith("customSections."),
        );
        if (sectionError) {
          const index = Number(sectionError.split(".")[1]);
          const key = submitted.customSections.filter(
            (s) => s.heading.trim() || s.body || s.image,
          )[index]?.key;
          if (key) setOpenSection(key);
        }
        document.getElementById("editor-message")?.focus();
      });
    },
    [form, pending],
  );

  /* Autosave — docs/04-ADMIN.md: "autosave every few seconds with a saved
     indicator". Only once the project exists: a new one waits for its first
     save, so opening the editor and walking away creates nothing. D-082. */
  useEffect(() => {
    if (isNew || !dirty || pending) return;
    const timer = setTimeout(() => save("save"), 2500);
    return () => clearTimeout(timer);
  }, [isNew, dirty, pending, save]);

  /* Ctrl/⌘ + S saves. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save("save");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [save]);

  const closePreview = useCallback(() => setPreview(false), []);

  const confirmLeave = (e: React.MouseEvent) => {
    if (
      dirty &&
      !window.confirm("Leave without saving? Your changes will be lost.")
    ) {
      e.preventDefault();
    }
  };

  const err = (key: string) => errors[key];
  const summaryLength = form.summary.length;
  const index = Math.max(0, (meta.position ?? 1) - 1);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-tint">
      {/* ---- top bar ---- */}
      <header className="sticky top-0 z-30 flex min-h-topbar-editor shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-white px-3 py-2 lg:px-6">
        <div className="flex min-w-0 items-center gap-3 lg:gap-4.5">
          <Link
            href="/admin/projects"
            onClick={confirmLeave}
            className="flex min-h-11 items-center gap-2 rounded-input px-1 text-caption font-semibold text-ink-3 transition-button hover:text-blue"
          >
            <ChevronLeftIcon />
            Projects
          </Link>
          <span
            aria-hidden="true"
            className="hidden h-5.5 w-px bg-border sm:block"
          />
          <h1 className="hidden min-w-0 truncate text-body font-bold text-ink sm:block">
            {form.title.trim() || (isNew ? "New project" : "Untitled")}
          </h1>
          <StateBadge state={meta.state} />
        </div>

        <div className="flex items-center gap-2.5">
          <span
            aria-live="polite"
            className="hidden font-mono text-mono-meta font-regular tracking-none text-muted md:inline"
          >
            {pending
              ? "Saving…"
              : dirty
                ? "Unsaved changes"
                : relativeTime(meta.updatedAt, now)}
          </span>
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setPreview(true)}
            icon={<EyeIcon size={14} />}
          >
            Preview page
          </Button>
          <Button
            size="xs"
            onClick={() => save("save")}
            disabled={pending || (!dirty && !isNew)}
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_var(--spacing-editor-rail)]">
        {/* ---- the form ---- */}
        <div className="flex min-w-0 flex-col gap-4.5 px-3 py-5 sm:px-5 lg:px-8 lg:py-6.5">
          <div id="editor-message" tabIndex={-1} className="outline-none">
            {message ? (
              <div
                role={message.tone === "error" ? "alert" : "status"}
                className={cn(
                  "flex flex-col gap-1.5 rounded-input px-4 py-3 text-caption",
                  message.tone === "error"
                    ? "bg-danger-bg text-danger-ink"
                    : "bg-success-bg text-success",
                )}
              >
                <p className="font-semibold">{message.text}</p>
                {message.tone === "error" && message.items.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {message.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {message.tone === "status" &&
                meta.state === "published" &&
                meta.slug ? (
                  <a
                    href={`/projects/${meta.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-2"
                  >
                    View the page ↗
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* ---- required ---- */}
          <section
            aria-labelledby={`${uid}-required`}
            className="flex flex-col gap-4 rounded-tile border border-border bg-white p-4.5 lg:p-6"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                id={`${uid}-required`}
                className="text-body font-bold text-ink"
              >
                Required
              </h2>
              <span
                className={cn(
                  "rounded-chip px-status-x py-status-y font-mono text-mono-chip uppercase",
                  missingCount === 0
                    ? "bg-success-bg text-success"
                    : "bg-warning-bg text-warning",
                )}
              >
                {missingCount === 0
                  ? "All complete"
                  : `${missingCount} to publish`}
              </span>
            </div>

            <div className="grid gap-3.5 md:grid-cols-3">
              <FormField
                label="Title"
                htmlFor={`${uid}-title`}
                size="sm"
                error={err("title")}
              >
                <Input
                  id={`${uid}-title`}
                  size="sm"
                  tone="field"
                  value={form.title}
                  maxLength={140}
                  error={err("title")}
                  onChange={(e) => set("title", e.target.value)}
                />
              </FormField>
              <FormField
                label="Client or context"
                htmlFor={`${uid}-client`}
                size="sm"
                error={err("client")}
              >
                <Input
                  id={`${uid}-client`}
                  size="sm"
                  tone="field"
                  value={form.client}
                  maxLength={140}
                  placeholder="Heelan Home Health Care, or Final Year Project"
                  error={err("client")}
                  onChange={(e) => set("client", e.target.value)}
                />
              </FormField>
              <FormField
                label="Year"
                htmlFor={`${uid}-year`}
                size="sm"
                error={err("year")}
              >
                <Input
                  id={`${uid}-year`}
                  size="sm"
                  tone="field"
                  inputMode="numeric"
                  value={form.year}
                  maxLength={4}
                  error={err("year")}
                  onChange={(e) =>
                    set("year", e.target.value.replace(/\D/g, ""))
                  }
                />
              </FormField>
            </div>

            <div className="grid gap-3.5 md:grid-cols-3">
              <FormField
                label="Type"
                htmlFor={`${uid}-type`}
                size="sm"
                error={err("type")}
              >
                <Select
                  id={`${uid}-type`}
                  size="sm"
                  tone="field"
                  value={form.type}
                  error={err("type")}
                  onChange={(e) =>
                    set("type", e.target.value as ProjectType | "")
                  }
                >
                  <option value="">Choose one</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {PROJECT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                label="Status"
                htmlFor={`${uid}-status`}
                size="sm"
                error={err("status")}
              >
                <Select
                  id={`${uid}-status`}
                  size="sm"
                  tone="field"
                  value={form.status}
                  error={err("status")}
                  onChange={(e) =>
                    set("status", e.target.value as ProjectStatusValue | "")
                  }
                >
                  <option value="">Choose one</option>
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PROJECT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField
                label="Slug"
                htmlFor={`${uid}-slug`}
                size="sm"
                error={err("slug")}
                hint={
                  form.slug ? undefined : "Made from the title when you save"
                }
              >
                <Input
                  id={`${uid}-slug`}
                  size="sm"
                  tone="field"
                  value={form.slug}
                  maxLength={80}
                  placeholder="heelan-home-health-care"
                  error={err("slug")}
                  className="font-mono"
                  onChange={(e) =>
                    set(
                      "slug",
                      e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    )
                  }
                />
              </FormField>
            </div>

            <FormField
              label="One-line summary"
              htmlFor={`${uid}-summary`}
              size="sm"
              error={err("summary")}
              aside={
                <span
                  className={cn(
                    "font-mono text-mono-chip",
                    summaryLength > PROJECT_SUMMARY_MAX
                      ? "text-danger"
                      : "text-muted",
                  )}
                >
                  {summaryLength} / {PROJECT_SUMMARY_MAX}
                </span>
              }
            >
              <Textarea
                id={`${uid}-summary`}
                size="sm"
                tone="field"
                rows={2}
                value={form.summary}
                maxLength={PROJECT_SUMMARY_MAX}
                error={err("summary")}
                onChange={(e) =>
                  set("summary", e.target.value.replace(/\n/g, " "))
                }
              />
            </FormField>

            <div className="grid gap-3.5 md:grid-cols-2">
              <div className="flex flex-col gap-field-gap-sm">
                <span className="text-fine font-semibold text-ink-3">
                  Cover image
                </span>
                <ImageField
                  label="Cover image"
                  image={form.cover}
                  error={err("coverImage")}
                  onChange={(image) => set("cover", image)}
                />
              </div>
              <FormField
                label="Stack tags"
                htmlFor={`${uid}-stack`}
                size="sm"
                error={err("stack")}
                hint="The only place on the site technology is named."
              >
                <TagInput
                  id={`${uid}-stack`}
                  tags={form.stack}
                  invalid={Boolean(err("stack"))}
                  onChange={(tags) => set("stack", tags)}
                />
              </FormField>
            </div>

            <hr className="border-border-faint" />

            <FormField
              label="The problem — heading (optional)"
              htmlFor={`${uid}-ph`}
              size="sm"
              error={err("problemHeading")}
            >
              <Input
                id={`${uid}-ph`}
                size="sm"
                tone="field"
                value={form.problemHeading}
                maxLength={140}
                placeholder="Care was happening, but nobody could see it"
                onChange={(e) => set("problemHeading", e.target.value)}
              />
            </FormField>
            <FormField
              label="The problem"
              htmlFor={`${uid}-problem`}
              size="sm"
              error={err("problem")}
              hint="Plain text. A blank line starts a new paragraph."
            >
              <Textarea
                id={`${uid}-problem`}
                size="sm"
                tone="field"
                rows={6}
                value={form.problem}
                maxLength={5000}
                error={err("problem")}
                onChange={(e) => set("problem", e.target.value)}
              />
            </FormField>

            <FormField
              label="What I built — heading (optional)"
              htmlFor={`${uid}-bh`}
              size="sm"
              error={err("bodyHeading")}
            >
              <Input
                id={`${uid}-bh`}
                size="sm"
                tone="field"
                value={form.bodyHeading}
                maxLength={140}
                placeholder="One request, five clear stages"
                onChange={(e) => set("bodyHeading", e.target.value)}
              />
            </FormField>
            <FormField
              label="What I built"
              htmlFor={`${uid}-body`}
              size="sm"
              error={err("body")}
              hint={FORMAT_HELP}
              aside={
                <span className="font-mono text-mono-chip text-muted">
                  {wordCount(form.body)} words
                </span>
              }
            >
              <BlockEditor
                id={`${uid}-body`}
                label="What I built"
                value={form.body}
                invalid={Boolean(err("body"))}
                onChange={(document) => set("body", document)}
              />
            </FormField>
          </section>

          {/* ---- optional ---- */}
          <section
            aria-labelledby={`${uid}-optional`}
            className="flex flex-col gap-3.5 rounded-tile border border-border bg-white p-4.5 lg:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id={`${uid}-optional`}
                className="text-body font-bold text-ink"
              >
                Optional blocks
              </h2>
              <span className="font-mono text-mono-meta font-regular tracking-none text-muted">
                empty blocks never appear on the page
              </span>
            </div>
            <OptionalBlocks
              form={form}
              set={set}
              errors={errors}
              testimonials={testimonials}
              open={openBlock}
              setOpen={setOpenBlock}
            />
            <hr className="my-1 border-border-faint" />
            <CustomSections
              form={form}
              set={set}
              errors={errors}
              openKey={openSection}
              setOpenKey={setOpenSection}
            />
          </section>
        </div>

        {/* ---- the rail ---- */}
        <aside className="flex flex-col gap-4.5 border-t border-border bg-white p-4.5 lg:border-t-0 lg:border-l lg:p-5.5">
          <div className="flex flex-col gap-2.25">
            <RailLabel>Card preview</RailLabel>
            <ProjectCard
              project={formToCardView(form)}
              index={index}
              href={null}
            />
          </div>

          <div className="flex flex-col gap-1">
            <RailLabel>Publishing</RailLabel>
            <div className="flex items-center justify-between gap-3">
              <span className="text-caption text-ink-3">
                Featured on home page
              </span>
              <Switch
                checked={form.featured}
                onChange={(on) => set("featured", on)}
                label="Featured on home page"
                disabled={meta.state !== "published"}
              />
            </div>
            {meta.state !== "published" ? (
              <p className="text-fine text-muted">
                Publish the project to feature it.
              </p>
            ) : err("featured") ? (
              <p role="alert" className="text-fine text-danger">
                {err("featured")}
              </p>
            ) : null}
            <div className="flex min-h-9 items-center justify-between gap-3">
              <span className="text-caption text-ink-3">Position in list</span>
              <span className="font-mono text-mono-label font-regular tracking-none text-ink">
                {meta.position
                  ? `${meta.position} of ${meta.total}`
                  : "Top, once saved"}
              </span>
            </div>
            <div className="flex min-h-9 items-center justify-between gap-3">
              <span className="text-caption text-ink-3">Published</span>
              <span className="font-mono text-mono-label font-regular tracking-none text-ink">
                {dateLabel(meta.publishedAt)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <RailLabel>Search engines</RailLabel>
            <FormField
              label="Title"
              htmlFor={`${uid}-seot`}
              size="sm"
              error={err("seoTitle")}
              aside={
                <Count n={form.seoTitle.length} max={PROJECT_SEO_TITLE_MAX} />
              }
            >
              <Input
                id={`${uid}-seot`}
                size="sm"
                tone="field"
                value={form.seoTitle}
                maxLength={PROJECT_SEO_TITLE_MAX}
                placeholder={form.title || "The project title"}
                onChange={(e) => set("seoTitle", e.target.value)}
              />
            </FormField>
            <FormField
              label="Description"
              htmlFor={`${uid}-seod`}
              size="sm"
              error={err("seoDescription")}
              aside={
                <Count
                  n={form.seoDescription.length}
                  max={PROJECT_SEO_DESCRIPTION_MAX}
                />
              }
              hint="Left empty, the title and the summary are used."
            >
              <Textarea
                id={`${uid}-seod`}
                size="sm"
                tone="field"
                rows={3}
                value={form.seoDescription}
                maxLength={PROJECT_SEO_DESCRIPTION_MAX}
                placeholder={form.summary || "The one-line summary"}
                onChange={(e) =>
                  set("seoDescription", e.target.value.replace(/\n/g, " "))
                }
              />
            </FormField>
          </div>

          <div className="flex flex-col gap-2.5 rounded-tile-sm bg-tint p-4">
            <RailLabel>Linked testimonial</RailLabel>
            <p className="text-caption leading-normal text-ink-body">
              {form.clientQuoteId
                ? `Showing ${testimonials.find((t) => t.id === form.clientQuoteId)?.label ?? "the chosen testimonial"} at the bottom of this page.`
                : "No published testimonial from this client yet. When one is approved, it appears at the bottom of this project page automatically."}
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-2.25 pt-2">
            {meta.state === "draft" ? (
              <Button
                block
                size="xs"
                onClick={() => save("publish")}
                disabled={pending}
              >
                {isNew ? "Save and publish" : "Publish"}
              </Button>
            ) : null}
            {meta.state === "published" ? (
              <Button
                block
                size="xs"
                variant="secondary"
                onClick={() => save("unpublish")}
                disabled={pending}
              >
                Unpublish
              </Button>
            ) : null}
            {meta.state === "archived" ? (
              <Button
                block
                size="xs"
                variant="secondary"
                onClick={() => save("restore")}
                disabled={pending}
              >
                Restore to draft
              </Button>
            ) : null}
            {meta.state !== "archived" && !isNew ? (
              <Button
                block
                size="xs"
                variant="danger"
                disabled={pending}
                onClick={() => {
                  if (
                    window.confirm(
                      "Archive this project? It leaves the site, and can be restored later.",
                    )
                  ) {
                    save("archive");
                  }
                }}
              >
                Archive project
              </Button>
            ) : null}
          </div>
        </aside>
      </div>

      {preview ? (
        <PreviewOverlay
          project={formToDetailView(form)}
          index={index}
          onClose={closePreview}
        />
      ) : null}
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-mono-chip tracking-wide text-muted uppercase">
      {children}
    </span>
  );
}

function Count({ n, max }: { n: number; max: number }) {
  return (
    <span
      className={cn(
        "font-mono text-mono-chip",
        n > max ? "text-danger" : "text-muted",
      )}
    >
      {n} / {max}
    </span>
  );
}
