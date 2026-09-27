"use client";

import Image from "next/image";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { IMAGE_WIDTHS, type ImageWidth } from "@/lib/editor-schema";
import { cn } from "@/lib/utils";
import { TrashIcon } from "../icons";

/**
 * An image inside the editor — docs/04-ADMIN.md: "Image with alt text, caption
 * and width (inline, wide, full-bleed)".
 *
 * The controls appear when the image is selected, so writing stays quiet. Alt
 * text is asked for every time: docs/02-DESIGN-SYSTEM.md, "every image has alt
 * text; decorative images get alt=''".
 */

const LABELS: Record<ImageWidth, string> = {
  inline: "Inline",
  wide: "Wide",
  full: "Full-bleed",
};

export function ImageView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: NodeViewProps) {
  const attrs = node.attrs as {
    src: string;
    width: number;
    height: number;
    alt: string;
    caption: string;
    size: ImageWidth;
  };

  return (
    <NodeViewWrapper
      className={cn(
        "my-5 flex flex-col gap-2 rounded-tile border p-2 transition-button",
        selected ? "border-blue bg-accent-soft" : "border-transparent",
      )}
    >
      <figure className="flex flex-col gap-2">
        <div
          className={cn(
            "overflow-hidden rounded-tile bg-accent-soft",
            attrs.size === "inline" && "mx-auto max-w-article",
          )}
        >
          {attrs.src ? (
            <Image
              src={attrs.src}
              width={attrs.width}
              height={attrs.height}
              alt={attrs.alt}
              sizes="(min-width: 1024px) 720px, 100vw"
              className="h-auto w-full"
            />
          ) : null}
        </div>
        {attrs.caption ? (
          <figcaption className="text-caption text-ink-body">
            {attrs.caption}
          </figcaption>
        ) : null}
      </figure>

      {selected ? (
        <div
          className="flex flex-col gap-2 rounded-input bg-white p-2.5"
          contentEditable={false}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-0.5 rounded-input bg-tint p-0.5">
              {IMAGE_WIDTHS.map((size) => (
                <button
                  key={size}
                  type="button"
                  aria-pressed={attrs.size === size}
                  onClick={() => updateAttributes({ size })}
                  className={cn(
                    "min-h-9 rounded-input px-3 text-fine font-semibold transition-button",
                    attrs.size === size
                      ? "bg-white text-blue"
                      : "text-muted-strong hover:text-ink",
                  )}
                >
                  {LABELS[size]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={deleteNode}
              aria-label="Remove this image"
              className="ml-auto flex size-9 items-center justify-center rounded-input text-muted transition-button hover:text-danger"
            >
              <TrashIcon size={14} />
            </button>
          </div>
          <input
            value={attrs.alt}
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            placeholder="Alt text — what the image shows, for someone who cannot see it"
            maxLength={300}
            className="w-full rounded-input border border-border bg-field px-field-sm-x py-field-sm-y text-caption text-ink outline-none placeholder:text-muted focus-visible:border-blue"
          />
          <input
            value={attrs.caption}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            placeholder="Caption (optional)"
            maxLength={300}
            className="w-full rounded-input border border-border bg-field px-field-sm-x py-field-sm-y text-caption text-ink outline-none placeholder:text-muted focus-visible:border-blue"
          />
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}
