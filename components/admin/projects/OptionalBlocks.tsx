"use client";

import { useId, useState } from "react";
import { Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { FormField, Input, Plus, Select, Textarea } from "@/components/ui";
import { newKey, type ProjectForm } from "@/lib/project-form";
import { wordCount } from "@/lib/editor-content";
import { BlockEditor } from "../editor/BlockEditor";
import type { TestimonialOption } from "@/lib/admin/projects";
import { cn } from "@/lib/utils";
import { GripIcon, TrashIcon } from "../icons";
import { ImageField, uploadImage } from "./ImageField";

/**
 * Optional blocks and custom sections — docs/04-ADMIN.md §5, drawn from
 * design/28-admin-project-editor.html.
 *
 * Each block is a tile saying FILLED or EMPTY; opening one edits it below the
 * grid. "Empty blocks never appear on the page" — the public page checks the
 * same thing (components/site/projects/ProjectPage.tsx).
 */

type SetField = <K extends keyof ProjectForm>(
  key: K,
  value: ProjectForm[K],
) => void;

type BlockId =
  | "constraints"
  | "decisions"
  | "outcome"
  | "gallery"
  | "liveUrl"
  | "repoUrl"
  | "roleTeam"
  | "clientQuote"
  | "timeline";

export const FORMAT_HELP =
  "Press / to insert a heading, a list, an image, a quote, a callout, a code block or an embed.";
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;
const host = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/** Which block a server error belongs to, so that block can be opened. */
export function blockForError(path: string): BlockId | "sections" | null {
  if (path.startsWith("constraints")) return "constraints";
  if (path.startsWith("decisions")) return "decisions";
  if (path.startsWith("outcome")) return "outcome";
  if (path.startsWith("gallery")) return "gallery";
  if (path === "liveUrl") return "liveUrl";
  if (path === "repoUrl") return "repoUrl";
  if (path === "role" || path.startsWith("team")) return "roleTeam";
  if (path === "clientQuote") return "clientQuote";
  if (path === "timeline") return "timeline";
  if (path.startsWith("customSections")) return "sections";
  return null;
}

export function OptionalBlocks({
  form,
  set,
  errors,
  testimonials,
  open,
  setOpen,
}: {
  form: ProjectForm;
  set: SetField;
  errors: Record<string, string>;
  testimonials: TestimonialOption[];
  open: BlockId | null;
  setOpen: (id: BlockId | null) => void;
}) {
  const quoteLabel = testimonials.find(
    (t) => t.id === form.clientQuoteId,
  )?.label;
  const teamCount = form.team.split("\n").filter((l) => l.trim()).length;

  const tiles: {
    id: BlockId;
    label: string;
    filled: boolean;
    summary: string;
  }[] = [
    {
      id: "constraints",
      label: "Constraints and what I cut",
      filled: Boolean(form.constraints),
      summary: plural(wordCount(form.constraints), "word"),
    },
    {
      id: "decisions",
      label: "Key decisions",
      filled: form.decisions.some((d) => d.decision.trim()),
      summary: plural(
        form.decisions.filter((d) => d.decision.trim()).length,
        "decision",
      ),
    },
    {
      id: "outcome",
      label: "Outcome",
      filled: Boolean(form.outcome),
      summary: plural(wordCount(form.outcome), "word"),
    },
    {
      id: "gallery",
      label: "Gallery",
      filled: form.gallery.length > 0,
      summary: plural(form.gallery.length, "image"),
    },
    {
      id: "liveUrl",
      label: "Live URL",
      filled: Boolean(form.liveUrl.trim()),
      summary: host(form.liveUrl),
    },
    {
      id: "repoUrl",
      label: "Repository URL",
      filled: Boolean(form.repoUrl.trim()),
      summary: host(form.repoUrl),
    },
    {
      id: "roleTeam",
      label: "Role and team",
      filled: Boolean(form.role.trim()) || teamCount > 0,
      summary: [
        form.role.trim(),
        teamCount ? plural(teamCount, "team line") : "",
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      id: "clientQuote",
      label: "Client quote",
      filled: Boolean(form.clientQuoteId),
      summary: quoteLabel ?? "",
    },
    {
      id: "timeline",
      label: "Timeline",
      filled: Boolean(form.timeline.trim()),
      summary: form.timeline,
    },
  ];

  const hasError = (id: BlockId) =>
    Object.keys(errors).some((path) => blockForError(path) === id);
  const current = tiles.find((t) => t.id === open);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const isOpen = open === tile.id;
          const error = hasError(tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              aria-expanded={isOpen}
              aria-controls="optional-block-editor"
              onClick={() => setOpen(isOpen ? null : tile.id)}
              className={cn(
                "flex min-h-13.5 items-center justify-between gap-3 rounded-tile-sm border px-4 py-3 text-left transition-button",
                error
                  ? "border-danger bg-danger-bg"
                  : isOpen
                    ? "border-blue bg-accent-soft"
                    : tile.filled
                      ? "border-blue-wash bg-tint-soft hover:border-blue-pale"
                      : "border-dashed border-border-strong hover:border-blue-wash",
              )}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  className={cn(
                    "text-caption",
                    tile.filled
                      ? "font-semibold text-ink"
                      : "font-medium text-muted-strong",
                  )}
                >
                  {tile.label}
                </span>
                {tile.filled && tile.summary ? (
                  <span className="truncate text-fine text-ink-body">
                    {tile.summary}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "shrink-0 font-mono text-mono-chip",
                  error
                    ? "text-danger"
                    : tile.filled
                      ? "text-success"
                      : "text-faint",
                )}
              >
                {error ? "CHECK" : tile.filled ? "FILLED" : "EMPTY"}
              </span>
            </button>
          );
        })}
      </div>

      {current ? (
        <div
          id="optional-block-editor"
          className="flex flex-col gap-3.5 rounded-tile border border-border bg-white p-4.5"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-caption font-bold text-ink">{current.label}</h3>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="min-h-11 px-2 font-mono text-mono-label font-regular tracking-none text-blue transition-button hover:text-blue-hover"
            >
              Done
            </button>
          </div>
          <BlockPanel
            id={current.id}
            form={form}
            set={set}
            errors={errors}
            testimonials={testimonials}
          />
        </div>
      ) : null}
    </div>
  );
}

function BlockPanel({
  id,
  form,
  set,
  errors,
  testimonials,
}: {
  id: BlockId;
  form: ProjectForm;
  set: SetField;
  errors: Record<string, string>;
  testimonials: TestimonialOption[];
}) {
  const uid = useId();

  switch (id) {
    case "constraints":
    case "outcome": {
      const headingKey =
        id === "constraints" ? "constraintsHeading" : "outcomeHeading";
      return (
        <>
          <FormField
            label="Heading (optional)"
            htmlFor={`${uid}-h`}
            size="sm"
            error={errors[headingKey]}
          >
            <Input
              id={`${uid}-h`}
              size="sm"
              tone="field"
              value={form[headingKey]}
              maxLength={140}
              placeholder={
                id === "constraints"
                  ? "Live nurse tracking, and the whole map"
                  : "What changed afterwards"
              }
              onChange={(e) => set(headingKey, e.target.value)}
            />
          </FormField>
          <FormField
            label={
              id === "constraints"
                ? "What was constrained, and what you cut"
                : "The outcome"
            }
            htmlFor={`${uid}-t`}
            size="sm"
            error={errors[id]}
            hint={FORMAT_HELP}
          >
            <BlockEditor
              id={`${uid}-t`}
              label={id === "constraints" ? "What I cut" : "The outcome"}
              value={form[id]}
              invalid={Boolean(errors[id])}
              onChange={(document) => set(id, document)}
            />
          </FormField>
        </>
      );
    }

    case "decisions":
      return (
        <>
          {form.decisions.length === 0 ? (
            <p className="text-caption text-ink-body">No decisions yet.</p>
          ) : null}
          <ol className="flex flex-col gap-3">
            {form.decisions.map((d, i) => (
              <li
                key={d.key}
                className="flex flex-col gap-2 rounded-input border border-border bg-tint-soft p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-mono-meta font-regular tracking-none text-muted">
                    Decision {i + 1}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove decision ${i + 1}`}
                    onClick={() =>
                      set(
                        "decisions",
                        form.decisions.filter((x) => x.key !== d.key),
                      )
                    }
                    className="flex size-11 items-center justify-center rounded-input text-muted transition-button hover:text-danger"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
                <FormField
                  label="The decision"
                  htmlFor={`${uid}-d${i}`}
                  size="sm"
                  error={errors[`decisions.${i}.decision`]}
                >
                  <Input
                    id={`${uid}-d${i}`}
                    size="sm"
                    value={d.decision}
                    maxLength={200}
                    onChange={(e) =>
                      set(
                        "decisions",
                        form.decisions.map((x) =>
                          x.key === d.key
                            ? { ...x, decision: e.target.value }
                            : x,
                        ),
                      )
                    }
                  />
                </FormField>
                <FormField
                  label="Why"
                  htmlFor={`${uid}-r${i}`}
                  size="sm"
                  error={errors[`decisions.${i}.reason`]}
                >
                  <Textarea
                    id={`${uid}-r${i}`}
                    size="sm"
                    rows={3}
                    value={d.reason}
                    maxLength={1000}
                    onChange={(e) =>
                      set(
                        "decisions",
                        form.decisions.map((x) =>
                          x.key === d.key
                            ? { ...x, reason: e.target.value }
                            : x,
                        ),
                      )
                    }
                  />
                </FormField>
              </li>
            ))}
          </ol>
          {form.decisions.length < 20 ? (
            <AddButton
              onClick={() =>
                set("decisions", [
                  ...form.decisions,
                  { key: newKey(), decision: "", reason: "" },
                ])
              }
            >
              Add a decision
            </AddButton>
          ) : null}
        </>
      );

    case "gallery":
      return <GalleryEditor form={form} set={set} errors={errors} />;

    case "liveUrl":
    case "repoUrl":
      return (
        <FormField
          label={
            id === "liveUrl" ? "Where the project runs" : "Where the code is"
          }
          htmlFor={`${uid}-u`}
          size="sm"
          error={errors[id]}
          hint="The full address, starting with https://"
        >
          <Input
            id={`${uid}-u`}
            size="sm"
            tone="field"
            type="url"
            inputMode="url"
            value={form[id]}
            maxLength={500}
            placeholder="https://"
            onChange={(e) => set(id, e.target.value)}
          />
        </FormField>
      );

    case "roleTeam":
      return (
        <>
          <FormField
            label="My role"
            htmlFor={`${uid}-role`}
            size="sm"
            error={errors.role}
          >
            <Input
              id={`${uid}-role`}
              size="sm"
              tone="field"
              value={form.role}
              maxLength={140}
              placeholder="Design and full build"
              onChange={(e) => set("role", e.target.value)}
            />
          </FormField>
          <FormField
            label="Team"
            htmlFor={`${uid}-team`}
            size="sm"
            error={
              Object.entries(errors).find(([k]) => k.startsWith("team"))?.[1]
            }
            hint="One line each — a person, or a sentence about the team."
          >
            <Textarea
              id={`${uid}-team`}
              size="sm"
              tone="field"
              rows={3}
              value={form.team}
              onChange={(e) => set("team", e.target.value)}
            />
          </FormField>
        </>
      );

    case "clientQuote":
      return (
        <FormField
          label="A published testimonial from this client"
          htmlFor={`${uid}-q`}
          size="sm"
          error={errors.clientQuote}
          hint={
            testimonials.length === 0
              ? "No testimonials are published yet. Once one linked to this project is approved, it appears on the page on its own."
              : "Left empty, a published testimonial linked to this project is used if there is one."
          }
        >
          <Select
            id={`${uid}-q`}
            size="sm"
            tone="field"
            value={form.clientQuoteId}
            disabled={testimonials.length === 0}
            onChange={(e) => set("clientQuoteId", e.target.value)}
          >
            <option value="">None chosen</option>
            {testimonials.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </FormField>
      );

    case "timeline":
      return (
        <FormField
          label="Timeline"
          htmlFor={`${uid}-tl`}
          size="sm"
          error={errors.timeline}
        >
          <Input
            id={`${uid}-tl`}
            size="sm"
            tone="field"
            value={form.timeline}
            maxLength={140}
            placeholder="Sept 2026 — ongoing"
            onChange={(e) => set("timeline", e.target.value)}
          />
        </FormField>
      );
  }
}

function GalleryEditor({
  form,
  set,
  errors,
}: {
  form: ProjectForm;
  set: SetField;
  errors: Record<string, string>;
}) {
  const uid = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const added: ProjectForm["gallery"] = [];
    try {
      for (const file of Array.from(files).slice(0, 24 - form.gallery.length)) {
        added.push({
          key: newKey(),
          image: await uploadImage(file),
          caption: "",
        });
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "An image could not be uploaded.",
      );
    } finally {
      if (added.length) set("gallery", [...form.gallery, ...added]);
      setBusy(false);
    }
  };

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2">
        {form.gallery.map((g, i) => (
          <li
            key={g.key}
            className="flex flex-col gap-2 rounded-input border border-border bg-tint-soft p-3"
          >
            <ImageField
              label={`Gallery image ${i + 1}`}
              image={g.image}
              error={errors[`gallery.${i}`]}
              onChange={(image) =>
                set(
                  "gallery",
                  image
                    ? form.gallery.map((x) =>
                        x.key === g.key ? { ...x, image } : x,
                      )
                    : form.gallery.filter((x) => x.key !== g.key),
                )
              }
            />
            <FormField
              label="Caption"
              htmlFor={`${uid}-c${i}`}
              size="sm"
              error={errors[`gallery.${i}.caption`]}
            >
              <Input
                id={`${uid}-c${i}`}
                size="sm"
                value={g.caption}
                maxLength={200}
                onChange={(e) =>
                  set(
                    "gallery",
                    form.gallery.map((x) =>
                      x.key === g.key ? { ...x, caption: e.target.value } : x,
                    ),
                  )
                }
              />
            </FormField>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="text-fine text-danger">
          {error}
        </p>
      ) : null}
      {form.gallery.length < 24 ? (
        <label
          className={cn(
            "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-tile-sm border border-dashed border-border-strong px-4 py-3 text-caption text-muted transition-button hover:border-blue-wash hover:text-blue",
            busy && "pointer-events-none opacity-60",
          )}
        >
          <Plus size={14} />
          {busy ? "Uploading…" : "Add images"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      ) : null}
    </>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center justify-center gap-2 rounded-tile-sm border border-dashed border-border-strong px-4 py-3 text-caption text-muted transition-button hover:border-blue-wash hover:text-blue"
    >
      <Plus size={14} />
      {children}
    </button>
  );
}

/* --------------------------------------------------------- custom sections */

export function CustomSections({
  form,
  set,
  errors,
  openKey,
  setOpenKey,
}: {
  form: ProjectForm;
  set: SetField;
  errors: Record<string, string>;
  openKey: string | null;
  setOpenKey: (key: string | null) => void;
}) {
  const add = () => {
    const key = newKey();
    set("customSections", [
      ...form.customSections,
      { key, id: null, heading: "", body: null, image: null },
    ]);
    setOpenKey(key);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-small font-bold text-ink">Custom sections</h3>
        {form.customSections.length < 20 ? (
          <button
            type="button"
            onClick={add}
            className="min-h-11 px-1 font-mono text-mono-label font-regular tracking-none text-blue transition-button hover:text-blue-hover"
          >
            + Add a section
          </button>
        ) : null}
      </div>

      {form.customSections.length > 0 ? (
        <Reorder.Group
          as="ul"
          axis="y"
          values={form.customSections}
          onReorder={(order) => set("customSections", order)}
          className="flex flex-col gap-2"
        >
          {form.customSections.map((section, i) => (
            <SectionRow
              key={section.key}
              index={i}
              count={form.customSections.length}
              section={section}
              form={form}
              set={set}
              errors={errors}
              open={openKey === section.key}
              onToggle={() =>
                setOpenKey(openKey === section.key ? null : section.key)
              }
            />
          ))}
        </Reorder.Group>
      ) : null}

      <AddButton onClick={add}>Add whatever this project needs</AddButton>
    </div>
  );
}

function SectionRow({
  index,
  count,
  section,
  form,
  set,
  errors,
  open,
  onToggle,
}: {
  index: number;
  count: number;
  section: ProjectForm["customSections"][number];
  form: ProjectForm;
  set: SetField;
  errors: Record<string, string>;
  open: boolean;
  onToggle: () => void;
}) {
  const controls = useDragControls();
  const reduced = useReducedMotion();
  const uid = useId();
  const hasError = Object.keys(errors).some((k) =>
    k.startsWith(`customSections.${index}.`),
  );

  const update = (patch: Partial<typeof section>) =>
    set(
      "customSections",
      form.customSections.map((s) =>
        s.key === section.key ? { ...s, ...patch } : s,
      ),
    );

  const move = (by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= count) return;
    const order = [...form.customSections];
    const [item] = order.splice(index, 1);
    order.splice(target, 0, item);
    set("customSections", order);
  };

  return (
    <Reorder.Item
      as="li"
      value={section}
      dragListener={false}
      dragControls={controls}
      layout="position"
      /* Reduced motion: rows jump to their new place instead of sliding. */
      transition={reduced ? { duration: 0 } : undefined}
      className={cn(
        "flex flex-col rounded-tile-sm border bg-white",
        hasError ? "border-danger" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 py-0.5 pr-2 pl-1">
        <button
          type="button"
          aria-label={`Reorder ${section.heading || "this section"}. Use the up and down arrow keys.`}
          onPointerDown={(e) => controls.start(e)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              move(-1);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              move(1);
            }
          }}
          className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-input text-blue-wash transition-button hover:text-muted-strong"
        >
          <GripIcon size={14} />
        </button>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-caption font-semibold",
            section.heading ? "text-ink" : "text-muted",
          )}
        >
          {section.heading || "Untitled section"}
        </span>
        <span className="hidden font-mono text-mono-meta font-regular tracking-none text-muted sm:inline">
          {section.image ? "text + image" : "text"}
        </span>
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="min-h-11 px-2 font-mono text-mono-meta font-regular tracking-none text-blue transition-button hover:text-blue-hover"
        >
          {open ? "Done" : "Edit"}
        </button>
      </div>

      {open ? (
        <div className="flex flex-col gap-3.5 border-t border-border-faint p-4">
          <FormField
            label="Heading"
            htmlFor={`${uid}-h`}
            size="sm"
            error={errors[`customSections.${index}.heading`]}
          >
            <Input
              id={`${uid}-h`}
              size="sm"
              tone="field"
              value={section.heading}
              maxLength={140}
              placeholder="The five stages of a visit"
              onChange={(e) => update({ heading: e.target.value })}
            />
          </FormField>
          <FormField
            label="Text"
            htmlFor={`${uid}-b`}
            size="sm"
            error={errors[`customSections.${index}.body`]}
            hint={FORMAT_HELP}
          >
            <BlockEditor
              id={`${uid}-b`}
              label={section.heading || "This section"}
              value={section.body}
              invalid={Boolean(errors[`customSections.${index}.body`])}
              onChange={(document) => update({ body: document })}
            />
          </FormField>
          <div className="flex flex-col gap-1.5">
            <span className="text-fine font-semibold text-ink-3">
              Image (optional)
            </span>
            <ImageField
              label="Section image"
              image={section.image}
              error={errors[`customSections.${index}.image`]}
              onChange={(image) => update({ image })}
            />
          </div>
          <button
            type="button"
            onClick={() =>
              set(
                "customSections",
                form.customSections.filter((s) => s.key !== section.key),
              )
            }
            className="flex min-h-11 items-center gap-1.5 self-start px-1 text-fine font-semibold text-danger transition-button hover:text-danger-ink"
          >
            <TrashIcon size={14} />
            Remove this section
          </button>
        </div>
      ) : null}
    </Reorder.Item>
  );
}

export type { BlockId };
