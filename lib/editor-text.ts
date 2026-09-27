import type { EditorNode } from "./editor-content";

/**
 * Plain text ⇄ the editor document, for the Phase 6 textareas.
 *
 * docs/06-BUILD-PROMPTS.md builds the Projects editor with plain textareas in
 * Phase 6 and replaces them with the block editor in Phase 7. The stored shape
 * is already the editor's JSON, so a textarea needs a way in and out of it.
 * This is that way: a small, predictable syntax, and a round trip that gives
 * back what it was given.
 *
 *   A blank line          starts a new paragraph
 *   ## Heading            a heading;  ### Sub-heading  a sub-heading
 *   - item                a bulleted list, one item per line
 *   1. item               a numbered list
 *   > note                a callout, the highlighted box
 *   **bold**  *italic*  `code`  [text](https://link)
 *
 * A single line break inside a paragraph is kept as a line break. DECISIONS.md
 * D-070.
 */

type Mark = NonNullable<EditorNode["marks"]>[number];

/* ------------------------------------------------------------------ inline */

const LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/;
const BOLD = /\*\*([^*\n]+?)\*\*/;
const ITALIC = /(?<![*\w])\*([^*\n]+?)\*(?![*\w])/;
const CODE = /`([^`\n]+)`/;

function textNode(text: string, marks: Mark[]): EditorNode {
  return marks.length > 0
    ? { type: "text", text, marks: marks.map((m) => ({ ...m })) }
    : { type: "text", text };
}

/** Parse one line's inline syntax into text nodes with marks. */
function parseInline(source: string, marks: Mark[] = []): EditorNode[] {
  if (!source) return [];

  /* Find the earliest match of any inline form; code first on a tie, since
     nothing inside backticks is formatting. */
  const forms = [
    { re: CODE, mark: (): Mark => ({ type: "code" }), inner: false },
    {
      re: LINK,
      mark: (m: RegExpExecArray): Mark => ({
        type: "link",
        attrs: { href: m[2] },
      }),
      inner: true,
    },
    { re: BOLD, mark: (): Mark => ({ type: "bold" }), inner: true },
    { re: ITALIC, mark: (): Mark => ({ type: "italic" }), inner: true },
  ];

  let best: {
    match: RegExpExecArray;
    form: (typeof forms)[number];
  } | null = null;
  for (const form of forms) {
    const match = form.re.exec(source);
    if (match && (!best || match.index < best.match.index)) {
      best = { match, form };
    }
  }

  if (!best) return [textNode(source, marks)];

  const { match, form } = best;
  const before = source.slice(0, match.index);
  const after = source.slice(match.index + match[0].length);
  const inner = [...marks, form.mark(match)];

  return [
    ...(before ? [textNode(before, marks)] : []),
    ...(form.inner
      ? parseInline(match[1], inner)
      : [textNode(match[1], inner)]),
    ...parseInline(after, marks),
  ];
}

/** Lines joined by hard breaks, each line parsed for inline syntax. */
function parseLines(lines: string[]): EditorNode[] {
  const out: EditorNode[] = [];
  lines.forEach((line, i) => {
    if (i > 0) out.push({ type: "hardBreak" });
    out.push(...parseInline(line));
  });
  return out;
}

/* ------------------------------------------------------------------ blocks */

const HEADING = /^(#{2,3})\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;
const CALLOUT = /^>\s?(.*)$/;

function listItem(text: string): EditorNode {
  const content = parseInline(text.trim());
  return {
    type: "listItem",
    content: [
      content.length > 0
        ? { type: "paragraph", content }
        : { type: "paragraph" },
    ],
  };
}

/** A block of consecutive non-blank lines. */
function parseBlock(lines: string[]): EditorNode[] {
  const nodes: EditorNode[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length === 0) return;
    const content = parseLines(paragraph);
    nodes.push(
      content.length > 0
        ? { type: "paragraph", content }
        : { type: "paragraph" },
    );
    paragraph = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const heading = HEADING.exec(line);

    if (heading) {
      flush();
      nodes.push({
        type: "heading",
        attrs: { level: heading[1].length },
        content: parseInline(heading[2].trim()),
      });
      i += 1;
    } else if (BULLET.test(line) || NUMBERED.test(line)) {
      flush();
      const numbered = NUMBERED.test(line);
      const re = numbered ? NUMBERED : BULLET;
      const items: EditorNode[] = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(listItem(re.exec(lines[i])![1]));
        i += 1;
      }
      nodes.push({
        type: numbered ? "orderedList" : "bulletList",
        content: items,
      });
    } else if (CALLOUT.test(line)) {
      flush();
      const quoted: string[] = [];
      while (i < lines.length && CALLOUT.test(lines[i])) {
        quoted.push(CALLOUT.exec(lines[i])![1]);
        i += 1;
      }
      const content = parseLines(quoted);
      nodes.push({
        type: "callout",
        content: [
          content.length > 0
            ? { type: "paragraph", content }
            : { type: "paragraph" },
        ],
      });
    } else {
      paragraph.push(line);
      i += 1;
    }
  }

  flush();
  return nodes;
}

/**
 * Text from a textarea → an editor document. Null when there is nothing but
 * whitespace, so an empty optional block stays empty in the database.
 */
export function textToDoc(text: string): EditorNode | null {
  const normalised = text.replace(/\r\n?/g, "\n").trim();
  if (!normalised) return null;

  const blocks = normalised
    .split(/\n\s*\n/)
    .map((b) => b.split("\n").map((l) => l.replace(/\s+$/, "")));

  const content = blocks.flatMap(parseBlock);
  return content.length > 0 ? { type: "doc", content } : null;
}

/* ---------------------------------------------------------------- the way out */

function inlineText(nodes: EditorNode[] | undefined): string {
  return (nodes ?? [])
    .map((node) => {
      if (node.type === "hardBreak") return "\n";
      if (node.type !== "text" || !node.text) return inlineText(node.content);

      let text = node.text;
      const has = (type: string) => node.marks?.find((m) => m.type === type);
      if (has("code")) text = `\`${text}\``;
      if (has("italic")) text = `*${text}*`;
      if (has("bold")) text = `**${text}**`;
      const link = has("link");
      const href = link?.attrs?.href;
      if (typeof href === "string" && href) text = `[${text}](${href})`;
      return text;
    })
    .join("");
}

/** The text of a list item or callout: its paragraphs, one per line. */
function containerText(node: EditorNode): string {
  return (node.content ?? [])
    .map((child) =>
      child.type === "paragraph" || child.type === "heading"
        ? inlineText(child.content)
        : blockText(child),
    )
    .join("\n");
}

function blockText(node: EditorNode): string {
  switch (node.type) {
    case "paragraph":
      return inlineText(node.content);
    case "heading": {
      const level = Number(node.attrs?.level) >= 3 ? 3 : 2;
      return `${"#".repeat(level)} ${inlineText(node.content)}`;
    }
    case "bulletList":
      return (node.content ?? [])
        .map((item) => `- ${containerText(item).replace(/\n/g, " ")}`)
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map(
          (item, i) => `${i + 1}. ${containerText(item).replace(/\n/g, " ")}`,
        )
        .join("\n");
    case "callout":
    case "blockquote":
      return containerText(node)
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "horizontalRule":
      return "";
    default:
      /* Anything the textarea has no syntax for — nothing yet, before the
         Phase 7 editor — keeps its words rather than vanishing. */
      return node.content ? containerText(node) : (node.text ?? "");
  }
}

/** An editor document → text for a textarea. */
export function docToText(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const root = doc as EditorNode;
  return (root.content ?? [])
    .map(blockText)
    .filter((block) => block.length > 0)
    .join("\n\n");
}
