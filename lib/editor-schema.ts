import type { EditorNode } from "./editor-content";
import { isEmptyDoc } from "./editor-content";

/**
 * What an editor document may contain — checked on the server before a
 * document is stored. docs/04-ADMIN.md: "Validate every field on the server",
 * "Sanitise all editor HTML on output".
 *
 * The admin sends the document as JSON, so nothing about its shape can be
 * trusted: unknown node types, unknown marks, unknown attributes and link
 * targets other than http, https and mailto are dropped here, and the size is
 * capped. Output is then rendered by React, which escapes every text node, so
 * no stored string ever reaches the page as markup.
 *
 * The list is exactly the blocks docs/04-ADMIN.md gives the editor:
 * paragraph, heading and sub-heading, bold / italic / inline code / links,
 * bulleted and numbered lists, quote, code block, image, divider, callout and
 * embed. Nothing else survives a save.
 */

const BLOCKS = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "callout",
  "codeBlock",
  "image",
  "embed",
  "horizontalRule",
  "hardBreak",
  "text",
]);

const MARKS = new Set(["bold", "italic", "code", "link"]);

/** The languages the code block offers. "text" is no highlighting. */
export const CODE_LANGUAGES = [
  "text",
  "bash",
  "css",
  "html",
  "javascript",
  "json",
  "python",
  "sql",
  "typescript",
] as const;
export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

/** "Image with alt text, caption and width (inline, wide, full-bleed)." */
export const IMAGE_WIDTHS = ["inline", "wide", "full"] as const;
export type ImageWidth = (typeof IMAGE_WIDTHS)[number];

/** "Embed (YouTube or a link card)." */
export const EMBED_KINDS = ["youtube", "link"] as const;

/** Generous for a case study, small enough that nobody stores a novel by accident. */
export const MAX_DOC_BYTES = 200_000;
const MAX_DEPTH = 12;

export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  return /^(https?:\/\/|mailto:)\S+$/i.test(href) && href.length <= 2000
    ? href
    : null;
}

/** The eleven-character id of a YouTube video, from any of its URL shapes. */
export function youtubeId(value: unknown): string | null {
  const href = safeHref(value);
  if (!href) return null;
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    const id =
      host === "youtu.be"
        ? url.pathname.slice(1)
        : host === "youtube.com" || host === "m.youtube.com"
          ? url.pathname.startsWith("/embed/") ||
            url.pathname.startsWith("/shorts/")
            ? url.pathname.split("/")[2]
            : url.searchParams.get("v")
          : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

const str = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const positive = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= 20_000 ? Math.round(n) : null;
};

/**
 * Where an image in a document may point: an upload, or one of the seeded
 * placeholder covers. Never an address off this site — an image loaded from
 * somewhere else would leak every reader to it.
 */
export function safeImageSrc(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const src = value.trim();
  const upload = /^\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/i;
  const placeholder = /^\/placeholders\/[a-z0-9-]+\.svg$/i;
  return upload.test(src) || placeholder.test(src) ? src : null;
}

/** An uploaded file's id, as lib/uploads.ts writes it. */
const fileId = (value: unknown): string | null =>
  typeof value === "string" && /^[0-9a-f]{24}$/i.test(value) ? value : null;

function clean(node: unknown, depth: number): EditorNode | null {
  if (!node || typeof node !== "object" || depth > MAX_DEPTH) return null;
  const n = node as Partial<EditorNode>;
  if (typeof n.type !== "string" || !BLOCKS.has(n.type)) return null;

  if (n.type === "text") {
    if (typeof n.text !== "string" || n.text.length === 0) return null;
    const marks = (Array.isArray(n.marks) ? n.marks : [])
      .map((m) => {
        if (!m || typeof m !== "object" || !MARKS.has(m.type)) return null;
        if (m.type !== "link") return { type: m.type };
        const href = safeHref(m.attrs?.href);
        return href ? { type: "link", attrs: { href } } : null;
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
    return marks.length > 0
      ? { type: "text", text: n.text, marks }
      : { type: "text", text: n.text };
  }

  const out: EditorNode = { type: n.type };
  const attrs = (n.attrs ?? {}) as Record<string, unknown>;

  if (n.type === "heading") {
    out.attrs = { level: Number(attrs.level) === 3 ? 3 : 2 };
  }

  if (n.type === "codeBlock") {
    const language = String(attrs.language ?? "text");
    out.attrs = {
      language: (CODE_LANGUAGES as readonly string[]).includes(language)
        ? language
        : "text",
    };
  }

  if (n.type === "image") {
    /* An image is only stored if it names a file this admin uploaded. */
    const id = fileId(attrs.fileId);
    const src = safeImageSrc(attrs.src);
    const width = positive(attrs.width);
    const height = positive(attrs.height);
    if (!id || !src || !width || !height) return null;
    const size = String(attrs.size ?? "inline");
    out.attrs = {
      fileId: id,
      src,
      width,
      height,
      alt: str(attrs.alt, 300),
      caption: str(attrs.caption, 300),
      size: (IMAGE_WIDTHS as readonly string[]).includes(size)
        ? size
        : "inline",
    };
  }

  if (n.type === "embed") {
    const href = safeHref(attrs.url);
    if (!href) return null;
    const video = youtubeId(href);
    out.attrs = video
      ? {
          url: href,
          kind: "youtube",
          videoId: video,
          title: str(attrs.title, 200),
        }
      : { url: href, kind: "link", title: str(attrs.title, 200) };
  }

  if (Array.isArray(n.content)) {
    const content = n.content
      .map((child) => clean(child, depth + 1))
      .filter((c): c is EditorNode => c !== null);
    if (content.length > 0) out.content = content;
  }

  /* An empty code block or quote is not worth storing. */
  if (
    (n.type === "codeBlock" ||
      n.type === "blockquote" ||
      n.type === "callout") &&
    !out.content
  ) {
    return null;
  }

  return out;
}

/**
 * A stored-safe copy of `value`, or null when it is not a document or holds
 * nothing visible. Throws when the document is larger than MAX_DOC_BYTES.
 */
export function sanitizeDoc(value: unknown): EditorNode | null {
  if (value === null || value === undefined) return null;
  if (JSON.stringify(value).length > MAX_DOC_BYTES) {
    throw new Error("That text is too long to save.");
  }
  const doc = clean(value, 0);
  if (!doc || doc.type !== "doc" || isEmptyDoc(doc)) return null;
  return doc;
}
