import { slugify } from "./slug";

/**
 * Helpers over the block editor's stored document — docs/04-ADMIN.md: "Built
 * on TipTap, stored as JSON, with plain text stored alongside for search and
 * excerpts", and "reading time and the table of contents generate from the
 * content."
 *
 * The editor is built in Phase 7; the stored shape is TipTap's (ProseMirror's)
 * JSON, which is stable and documented, so these can run on save from Phase 4.
 *
 * Pure functions with no database access, so the models call them from their
 * save hooks and the Phase 7 renderer can reuse them.
 */

/** A node in the stored editor document. */
export type EditorNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: EditorNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export type TocEntry = { level: number; text: string; anchor: string };

/** Nodes after which a line break belongs in the plain text. */
const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "listItem",
  "callout",
  "horizontalRule",
  "image",
]);

/**
 * Reading speed. 200 words a minute is at the slow end of the usual range on
 * purpose: much of this audience reads English as a second or third language,
 * and a "6 min read" that takes ten erodes trust. DECISIONS.md D-046.
 */
const WORDS_PER_MINUTE = 200;

/** Editor "Heading" and "Sub-heading". The post title is the page's h1. */
const TOC_LEVELS = new Set([2, 3]);

export function isEditorDoc(value: unknown): value is EditorNode {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as EditorNode).type === "string"
  );
}

/** Blocks that are content even with no words in them. */
const SILENT_BLOCKS = new Set(["image", "embed"]);

/** True when the document holds no visible text, image or embed. */
export function isEmptyDoc(doc: unknown): boolean {
  if (!isEditorDoc(doc)) return true;
  const hasBlock = (node: EditorNode): boolean =>
    SILENT_BLOCKS.has(node.type) || (node.content ?? []).some(hasBlock);
  return plainText(doc).trim().length === 0 && !hasBlock(doc);
}

/** Every uploaded file an editor document points at — for File.usedBy. */
export function imageFileIds(doc: unknown): string[] {
  const ids = new Set<string>();
  const walk = (node: EditorNode) => {
    if (node.type === "image" && typeof node.attrs?.fileId === "string") {
      ids.add(node.attrs.fileId);
    }
    (node.content ?? []).forEach(walk);
  };
  if (isEditorDoc(doc)) walk(doc);
  return [...ids];
}

/** Every text node joined, with a line break after each block. */
export function plainText(doc: unknown): string {
  if (!isEditorDoc(doc)) return "";
  const out: string[] = [];

  const walk = (node: EditorNode) => {
    if (node.type === "text" && node.text) out.push(node.text);
    if (node.type === "hardBreak") out.push("\n");
    (node.content ?? []).forEach(walk);
    if (BLOCK_TYPES.has(node.type)) out.push("\n");
  };

  walk(doc);
  return out
    .join("")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function wordCount(doc: unknown): number {
  const text = plainText(doc);
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return words ? words.length : 0;
}

/** Whole minutes, never less than one. */
export function readingTime(doc: unknown): number {
  return Math.max(1, Math.ceil(wordCount(doc) / WORDS_PER_MINUTE));
}

/**
 * The headings, in order, with a unique anchor each. Duplicate headings get
 * `-2`, `-3`, so two "Outcome" sections still link to different places. The
 * renderer in Phase 7 must give each heading the anchor at the same position.
 */
export function tableOfContents(doc: unknown): TocEntry[] {
  if (!isEditorDoc(doc)) return [];
  const entries: TocEntry[] = [];
  /* Every anchor already handed out, so a heading literally titled
     "Outcome 2" cannot collide with the second "Outcome". */
  const used = new Set<string>();

  const textOf = (node: EditorNode): string =>
    node.type === "text"
      ? (node.text ?? "")
      : (node.content ?? []).map(textOf).join("");

  const walk = (node: EditorNode) => {
    if (node.type === "heading") {
      const level = Number(node.attrs?.level);
      const text = textOf(node).trim();
      if (TOC_LEVELS.has(level) && text) {
        const base = slugify(text) || "section";
        let anchor = base;
        for (let n = 2; used.has(anchor); n += 1) anchor = `${base}-${n}`;
        used.add(anchor);
        entries.push({ level, text, anchor });
      }
      return;
    }
    (node.content ?? []).forEach(walk);
  };

  walk(doc);
  return entries;
}
