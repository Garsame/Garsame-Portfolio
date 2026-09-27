"use client";

import { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { safeHref, youtubeId } from "@/lib/editor-schema";
import { cn } from "@/lib/utils";
import { TrashIcon } from "../icons";

/**
 * An embed — docs/04-ADMIN.md: "Embed (YouTube or a link card)".
 *
 * A YouTube address becomes a player; anything else becomes a link card. The
 * address is checked here and again on save (lib/editor-schema.ts), and only
 * http, https and mailto survive either check.
 */
export function EmbedView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const attrs = node.attrs as {
    url: string;
    kind: "youtube" | "link";
    videoId: string | null;
    title: string;
  };
  const [draft, setDraft] = useState(attrs.url);
  const [error, setError] = useState<string | null>(null);

  const apply = () => {
    const href = safeHref(draft);
    if (!href) {
      setError("Paste a full address starting with https://");
      return;
    }
    const video = youtubeId(href);
    setError(null);
    updateAttributes({
      url: href,
      kind: video ? "youtube" : "link",
      videoId: video,
    });
  };

  return (
    <NodeViewWrapper
      className={cn(
        "my-5 flex flex-col gap-2 rounded-tile border p-2 transition-button",
        selected ? "border-blue bg-accent-soft" : "border-transparent",
      )}
    >
      {attrs.kind === "youtube" && attrs.videoId ? (
        <div className="aspect-video overflow-hidden rounded-tile bg-ink">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${attrs.videoId}`}
            title={attrs.title || "YouTube video"}
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : attrs.url ? (
        <div className="flex flex-col gap-1 rounded-tile border border-border bg-tint-soft px-5 py-4">
          <span className="text-caption font-bold text-ink">
            {attrs.title || "Link"}
          </span>
          <span className="truncate font-mono text-mono-meta font-regular tracking-none text-blue">
            {attrs.url}
          </span>
        </div>
      ) : (
        <p className="rounded-tile border border-dashed border-border-strong px-5 py-4 text-caption text-muted">
          Paste a YouTube address or any link below.
        </p>
      )}

      {selected ? (
        <div
          className="flex flex-col gap-2 rounded-input bg-white p-2.5"
          contentEditable={false}
        >
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={apply}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  apply();
                }
              }}
              placeholder="https://"
              inputMode="url"
              className="w-full rounded-input border border-border bg-field px-field-sm-x py-field-sm-y font-mono text-mono-meta font-regular tracking-none text-ink outline-none placeholder:text-muted focus-visible:border-blue"
            />
            <button
              type="button"
              onClick={deleteNode}
              aria-label="Remove this embed"
              className="flex size-9 shrink-0 items-center justify-center rounded-input text-muted transition-button hover:text-danger"
            >
              <TrashIcon size={14} />
            </button>
          </div>
          {attrs.kind === "link" && attrs.url ? (
            <input
              value={attrs.title}
              onChange={(e) => updateAttributes({ title: e.target.value })}
              placeholder="What is this link? (shown on the card)"
              maxLength={200}
              className="w-full rounded-input border border-border bg-field px-field-sm-x py-field-sm-y text-caption text-ink outline-none placeholder:text-muted focus-visible:border-blue"
            />
          ) : null}
          {error ? (
            <p role="alert" className="text-fine text-danger">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}
