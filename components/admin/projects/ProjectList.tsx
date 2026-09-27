"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { Button, Plus, StatusChip, Switch } from "@/components/ui";
import {
  reorderProjectsAction,
  setProjectFeaturedAction,
} from "@/app/admin/(panel)/projects/actions";
import type { AdminProjectRow } from "@/lib/admin/projects";
import { PROJECT_TYPE_LABELS } from "@/lib/project-rules";
import { indexTag } from "@/lib/project-view";
import { cn } from "@/lib/utils";
import { StateBadge } from "../StateBadge";
import { ArrowDownIcon, ArrowUpIcon, GripIcon, InfoIcon } from "../icons";

/**
 * The projects list — design/27-admin-projects-list.html.
 *
 * Two groups, as the design draws them: the featured projects, then a rule,
 * then everything else. That is also the public order — docs/03-PAGES.md puts
 * featured projects first on /projects — so the list reads top to bottom
 * exactly as visitors see it. Dragging reorders within a group. D-076.
 *
 * Drag by the handle with a mouse or a finger. From the keyboard, focus the
 * handle and use the arrow keys; each move is announced. Every change is saved
 * at once and the page refreshes from the server, which stays the authority.
 */

type Group = "featured" | "rest";

export function ProjectList({
  initial,
  maxFeatured,
}: {
  initial: AdminProjectRow[];
  maxFeatured: number;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [source, setSource] = useState(initial);
  const [message, setMessage] = useState<{
    tone: "error" | "status";
    text: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  /* New data from the server after a refresh replaces the local copy. */
  if (initial !== source) {
    setSource(initial);
    setRows(initial);
  }

  const featured = rows.filter((r) => r.featured);
  const rest = rows.filter((r) => !r.featured);
  const limitReached = featured.length >= maxFeatured;

  const persist = (next: AdminProjectRow[], announce?: string) => {
    startTransition(async () => {
      const result = await reorderProjectsAction(next.map((r) => r.id));
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        setRows(source);
        return;
      }
      setMessage(announce ? { tone: "status", text: announce } : null);
      router.refresh();
    });
  };

  const setGroup = (group: Group, order: AdminProjectRow[]) => {
    setRows(
      group === "featured" ? [...order, ...rest] : [...featured, ...order],
    );
  };

  const move = (group: Group, index: number, by: -1 | 1) => {
    const list = group === "featured" ? featured : rest;
    const target = index + by;
    if (target < 0 || target >= list.length) return;
    const order = [...list];
    const [item] = order.splice(index, 1);
    order.splice(target, 0, item);
    const next =
      group === "featured" ? [...order, ...rest] : [...featured, ...order];
    setRows(next);
    persist(
      next,
      `${item.title} moved to position ${target + 1} of ${list.length}.`,
    );
  };

  const toggleFeatured = (row: AdminProjectRow, on: boolean) => {
    const updated = rows.map((r) =>
      r.id === row.id ? { ...r, featured: on } : r,
    );
    const next = [
      ...updated.filter((r) => r.featured),
      ...updated.filter((r) => !r.featured),
    ];
    setRows(next);
    startTransition(async () => {
      const result = await setProjectFeaturedAction(row.id, on);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        setRows(source);
        return;
      }
      /* Save the order as it now reads, so the home page shows exactly this. */
      const saved = await reorderProjectsAction(next.map((r) => r.id));
      setMessage(
        saved.ok
          ? {
              tone: "status",
              text: on
                ? `${row.title} is featured on the home page.`
                : `${row.title} is no longer featured.`,
            }
          : { tone: "error", text: saved.error },
      );
      router.refresh();
    });
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-card border border-border bg-white p-5.5">
        <p className="text-small text-ink-body">
          No projects yet. The first one you add appears at the top of this
          list.
        </p>
        <Button
          href="/admin/projects/new"
          size="xs"
          icon={<Plus size={14} strokeWidth={2.2} />}
        >
          New project
        </Button>
      </div>
    );
  }

  const renderGroup = (
    group: Group,
    list: AdminProjectRow[],
    offset: number,
  ) => (
    <Reorder.Group
      as="ul"
      axis="y"
      values={list}
      onReorder={(order) => setGroup(group, order)}
      className="flex flex-col gap-2.5"
    >
      {list.map((row, i) => (
        <ProjectRow
          key={row.id}
          row={row}
          index={offset + i}
          position={i}
          count={list.length}
          busy={pending}
          canFeature={
            row.featured || (!limitReached && row.state === "published")
          }
          onMove={(by) => move(group, i, by)}
          onDrop={() => persist(rows)}
          onFeature={(on) => toggleFeatured(row, on)}
        />
      ))}
    </Reorder.Group>
  );

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-start gap-2.75 rounded-tile-sm bg-accent-soft px-4 py-3.25">
        <InfoIcon className="mt-0.5 shrink-0 text-blue" />
        <p className="text-caption text-accent-ink">
          The order here is the order visitors see. Projects with{" "}
          <strong className="font-bold">Featured</strong> on come first and also
          appear on the home page, at most {maxFeatured}.
        </p>
      </div>

      <p
        role={message?.tone === "error" ? "alert" : "status"}
        className={cn(
          message ? "rounded-input px-3.5 py-3 text-caption" : "sr-only",
          message?.tone === "error"
            ? "bg-danger-bg text-danger-ink"
            : message
              ? "bg-success-bg text-success"
              : "",
        )}
      >
        {message?.text ?? ""}
      </p>

      {featured.length > 0 ? renderGroup("featured", featured, 0) : null}

      <div
        className="flex items-center gap-3 py-1"
        aria-hidden={featured.length === 0}
      >
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-mono-chip tracking-wide text-faint uppercase">
          {limitReached
            ? `Featured limit reached — ${featured.length} of ${maxFeatured}`
            : `Featured — ${featured.length} of ${maxFeatured}`}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {rest.length > 0 ? renderGroup("rest", rest, featured.length) : null}
    </div>
  );
}

function ProjectRow({
  row,
  index,
  position,
  count,
  busy,
  canFeature,
  onMove,
  onDrop,
  onFeature,
}: {
  row: AdminProjectRow;
  index: number;
  position: number;
  count: number;
  busy: boolean;
  canFeature: boolean;
  onMove: (by: -1 | 1) => void;
  onDrop: () => void;
  onFeature: (on: boolean) => void;
}) {
  const controls = useDragControls();
  const reduced = useReducedMotion();
  const [dragging, setDragging] = useState(false);

  const featureHint = row.featured
    ? undefined
    : row.state !== "published"
      ? "Publish the project before featuring it."
      : !canFeature
        ? "Three projects are featured already. Turn one off first."
        : undefined;

  return (
    <Reorder.Item
      as="li"
      value={row}
      dragListener={false}
      dragControls={controls}
      layout="position"
      /* Reduced motion: rows jump to their new place instead of sliding. */
      transition={reduced ? { duration: 0 } : undefined}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false);
        onDrop();
      }}
      className={cn(
        "relative flex flex-wrap items-center gap-x-4 gap-y-3 rounded-tile border bg-white px-3 py-3.5 lg:flex-nowrap lg:px-4.5",
        dragging ? "z-10 border-blue-wash" : "border-border",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${row.title}. Use the up and down arrow keys. Position ${position + 1} of ${count}.`}
        onPointerDown={(e) => controls.start(e)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onMove(-1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onMove(1);
          }
        }}
        disabled={busy && !dragging}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-input text-faint transition-button hover:text-muted-strong active:cursor-grabbing lg:-ml-2.5"
      >
        <GripIcon />
      </button>

      <span className="hidden h-12 w-17.5 shrink-0 overflow-hidden rounded-chip bg-accent-soft sm:block">
        {row.cover ? (
          <Image
            src={row.cover.url}
            width={row.cover.width}
            height={row.cover.height}
            alt=""
            sizes="70px"
            unoptimized={row.cover.mimeType === "image/svg+xml"}
            className="h-full w-full object-cover"
          />
        ) : null}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.75 lg:flex-[2.4]">
        <Link
          href={`/admin/projects/${row.id}`}
          className="truncate text-body font-bold text-ink transition-button hover:text-blue"
        >
          {row.title}
        </Link>
        <span className="truncate font-mono text-mono-meta font-regular tracking-none text-muted">
          {indexTag(index)}
          {row.client ? ` · ${row.client}` : ""}
        </span>
      </div>

      {/* Below 1024px the details wrap onto a second line under the title. */}
      <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 pl-15 lg:contents">
        <span className="font-mono text-mono-label font-regular tracking-none text-ink-body lg:flex-1">
          {row.type ? PROJECT_TYPE_LABELS[row.type] : "—"}
        </span>
        <span className="lg:flex-1">
          {row.status ? <StatusChip status={row.status} /> : null}
        </span>
        <span className="lg:w-27.5" title={featureHint}>
          <Switch
            checked={row.featured}
            onChange={onFeature}
            label="Featured"
            showLabel
            disabled={busy || (!row.featured && !canFeature)}
          />
        </span>
        <span className="lg:w-22.5">
          <StateBadge state={row.state} />
        </span>
        <span className="flex items-center gap-1 lg:w-20 lg:justify-end">
          <span className="flex lg:hidden">
            <button
              type="button"
              aria-label={`Move ${row.title} up`}
              onClick={() => onMove(-1)}
              disabled={busy || position === 0}
              className="flex size-11 items-center justify-center rounded-input text-muted transition-button hover:text-blue disabled:opacity-40"
            >
              <ArrowUpIcon />
            </button>
            <button
              type="button"
              aria-label={`Move ${row.title} down`}
              onClick={() => onMove(1)}
              disabled={busy || position === count - 1}
              className="flex size-11 items-center justify-center rounded-input text-muted transition-button hover:text-blue disabled:opacity-40"
            >
              <ArrowDownIcon />
            </button>
          </span>
          <Link
            href={`/admin/projects/${row.id}`}
            aria-label={`Edit ${row.title}`}
            className="flex min-h-11 items-center px-2 font-mono text-mono-label font-regular tracking-none text-blue transition-button hover:text-blue-hover"
          >
            Edit
          </Link>
        </span>
      </div>
    </Reorder.Item>
  );
}
