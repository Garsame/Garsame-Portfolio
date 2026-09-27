import type { Editor } from "@tiptap/react";
import { Plus } from "@/components/ui";

/**
 * Everything the + button and the / menu can insert — docs/04-ADMIN.md's block
 * list, in the order design/26-admin-editor.html draws it.
 *
 * One list, so the two ways of inserting can never offer different things.
 */

export type InsertItem = {
  id: string;
  label: string;
  hint?: string;
  /** Typing any of these after "/" finds it. */
  keywords: string[];
  icon: React.ReactNode;
  /** Images go through the file picker, so they are handled by the caller. */
  run: (editor: Editor, pickImage: () => void) => void;
};

const Glyph = ({ children }: { children: React.ReactNode }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const Letter = ({ children }: { children: React.ReactNode }) => (
  <span className="text-caption font-bold">{children}</span>
);

export const INSERT_ITEMS: InsertItem[] = [
  {
    id: "image",
    label: "Image",
    hint: "Upload a picture",
    keywords: ["image", "picture", "photo", "upload"],
    icon: (
      <Glyph>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 16l5-4 4 3 3-2 6 5" />
      </Glyph>
    ),
    run: (_editor, pickImage) => pickImage(),
  },
  {
    id: "heading",
    label: "Heading",
    hint: "Start a new section",
    keywords: ["heading", "h2", "title"],
    icon: <Letter>H</Letter>,
    run: (editor) =>
      editor.chain().focus().setNode("heading", { level: 2 }).run(),
  },
  {
    id: "subheading",
    label: "Sub-heading",
    keywords: ["sub", "subheading", "h3"],
    icon: <Letter>h</Letter>,
    run: (editor) =>
      editor.chain().focus().setNode("heading", { level: 3 }).run(),
  },
  {
    id: "bulletList",
    label: "Bulleted list",
    keywords: ["bullet", "list", "unordered"],
    icon: (
      <Glyph>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </Glyph>
    ),
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: "orderedList",
    label: "Numbered list",
    keywords: ["number", "ordered", "list"],
    icon: (
      <Glyph>
        <path d="M9 6h12M9 12h12M9 18h12M4 5h1v4M4 13h2v1H4v2h2" />
      </Glyph>
    ),
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: "codeBlock",
    label: "Code block",
    keywords: ["code", "snippet"],
    icon: (
      <Glyph>
        <path d="M8 6l-5 6 5 6M16 6l5 6-5 6" />
      </Glyph>
    ),
    run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: "blockquote",
    label: "Quote",
    keywords: ["quote", "blockquote"],
    icon: (
      <Glyph>
        <path d="M6 4v16M18 4v16" />
      </Glyph>
    ),
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: "callout",
    label: "Callout",
    hint: "The highlighted box",
    keywords: ["callout", "note", "highlight"],
    icon: (
      <Glyph>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16v.01" />
      </Glyph>
    ),
    run: (editor) => editor.chain().focus().setCallout().run(),
  },
  {
    id: "divider",
    label: "Divider",
    keywords: ["divider", "rule", "line", "hr"],
    icon: (
      <Glyph>
        <path d="M3 12h18" />
      </Glyph>
    ),
    run: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    id: "embed",
    label: "Embed",
    hint: "A video or a link",
    keywords: ["embed", "video", "youtube", "link"],
    icon: (
      <Glyph>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M10 9l5 3-5 3z" />
      </Glyph>
    ),
    run: (editor) => editor.chain().focus().insertEmbed({}).run(),
  },
];

export const PlusGlyph = Plus;
