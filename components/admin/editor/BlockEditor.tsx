"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EditorContent as TipTapCanvas,
  useEditor,
  type Editor,
} from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { createLowlight } from "lowlight";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import { Plus } from "@/components/ui";
import type { EditorNode } from "@/lib/editor-content";
import { CODE_LANGUAGES, safeHref } from "@/lib/editor-schema";
import { readingTime, wordCount } from "@/lib/editor-content";
import { cn } from "@/lib/utils";
import { CloseIcon } from "../icons";
import { uploadImage } from "../projects/ImageField";
import { Callout, Embed, ProjectImage } from "./nodes";
import { INSERT_ITEMS, type InsertItem } from "./insert-items";

/**
 * The block editor — docs/04-ADMIN.md, "The editor — shared by Blog, Projects
 * and Updates", drawn from design/26-admin-editor.html.
 *
 * Three ways to insert, as the document asks: the + button in the left margin
 * of an empty line, typing "/" anywhere, and the markdown-style input rules
 * TipTap brings ("## " for a heading, "- " for a list).
 *
 * Text sizing is by named level only. There is no font-size control anywhere
 * in here, deliberately — docs/04-ADMIN.md.
 *
 * Every document it produces is checked again on the server before it is
 * stored (lib/editor-schema.ts): this component is convenience, not security.
 */

const lowlight = createLowlight();
lowlight.register({
  bash,
  css,
  html: xml,
  javascript,
  json,
  python,
  sql,
  typescript,
});

export type BlockEditorProps = {
  value: EditorNode | null;
  onChange: (doc: EditorNode | null) => void;
  placeholder?: string;
  /** Labels the editing area for screen readers. */
  label: string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
};

export function BlockEditor({
  value,
  onChange,
  placeholder = "Write here, or press / to insert something",
  label,
  id,
  invalid = false,
  describedBy,
}: BlockEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [menu, setMenu] = useState<{
    open: boolean;
    query: string;
    anchor: DOMRect | null;
  }>({
    open: false,
    query: "",
    anchor: null,
  });
  const [active, setActive] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  /* The last document handed up, so an outside change can be told apart from
     one this editor made. */
  const lastEmitted = useRef<string>(JSON.stringify(value));

  const editor = useEditor({
    /* Next.js renders this on the server first; TipTap must wait. */
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        /* Not in the block list of docs/04-ADMIN.md. */
        strike: false,
        underline: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          protocols: ["http", "https", "mailto"],
        },
      }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "text" }),
      Callout,
      ProjectImage,
      Embed,
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value ?? "",
    editorProps: {
      attributes: {
        class: "editor-canvas",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        ...(id ? { id } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      },
      handleDrop: (view, event) => {
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return false;
        event.preventDefault();
        void insertImage(file);
        return true;
      },
      handlePaste: (view, event) => {
        const file = event.clipboardData?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return false;
        event.preventDefault();
        void insertImage(file);
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => {
      /* Plain objects, deeply. ProseMirror builds a node's attrs with a null
         prototype, and a Server Action refuses to serialise one of those: the
         attributes arrive at the server as an opaque reference and the save
         fails. Round-tripping through JSON gives ordinary objects. D-086. */
      const json = JSON.parse(JSON.stringify(instance.getJSON())) as EditorNode;
      const next = instance.isEmpty ? null : json;
      lastEmitted.current = JSON.stringify(next);
      onChange(next);
      trackSlash(instance);
    },
    onSelectionUpdate: ({ editor: instance }) => trackSlash(instance),
  });

  /* An outside change — a server reset, or another project loaded. */
  useEffect(() => {
    if (!editor) return;
    const incoming = JSON.stringify(value);
    if (incoming === lastEmitted.current) return;
    lastEmitted.current = incoming;
    editor.commands.setContent(value ?? "", { emitUpdate: false });
  }, [editor, value]);

  /* ---- the / menu ---- */
  const trackSlash = useCallback((instance: Editor) => {
    const { state } = instance;
    const { $from, empty } = state.selection;
    if (!empty || $from.parent.type.name === "codeBlock") {
      setMenu((m) => (m.open ? { ...m, open: false } : m));
      return;
    }
    const before = $from.parent.textBetween(0, $from.parentOffset, "\n", " ");
    const match = /(?:^|\s)\/([\w-]*)$/.exec(before);
    if (!match) {
      setMenu((m) => (m.open ? { ...m, open: false } : m));
      return;
    }
    const coords = instance.view.coordsAtPos($from.pos);
    /* Typing more narrows the list, so the highlight goes back to the top. */
    setActive(0);
    setMenu({
      open: true,
      query: match[1],
      anchor: new DOMRect(coords.left, coords.bottom, 0, 0),
    });
  }, []);

  const matches = useMemo(() => {
    const query = menu.query.toLowerCase();
    if (!query) return INSERT_ITEMS;
    return INSERT_ITEMS.filter((item) =>
      item.keywords.some((word) => word.startsWith(query)),
    );
  }, [menu.query]);

  const pickImage = useCallback(() => fileRef.current?.click(), []);

  const insertImage = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      try {
        const image = await uploadImage(file);
        editor
          ?.chain()
          .focus()
          .insertProjectImage({
            fileId: image.id,
            src: image.url,
            width: image.width,
            height: image.height,
            alt: image.alt,
          })
          .run();
      } catch (error) {
        setUploadError(
          error instanceof Error
            ? error.message
            : "The image could not be uploaded.",
        );
      } finally {
        setUploading(false);
      }
    },
    [editor],
  );

  /** Runs an item, first removing the "/query" that opened the menu. */
  const runItem = useCallback(
    (item: InsertItem) => {
      if (!editor) return;
      if (menu.open) {
        const { $from } = editor.state.selection;
        const length = menu.query.length + 1;
        editor
          .chain()
          .focus()
          .deleteRange({ from: $from.pos - length, to: $from.pos })
          .run();
      }
      setMenu({ open: false, query: "", anchor: null });
      item.run(editor, pickImage);
    },
    [editor, menu.open, menu.query, pickImage],
  );

  /* Arrow keys and Enter drive the open menu. */
  useEffect(() => {
    if (!menu.open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((i) => (i + 1) % Math.max(matches.length, 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(
          (i) => (i - 1 + matches.length) % Math.max(matches.length, 1),
        );
      } else if (event.key === "Enter" && matches[active]) {
        event.preventDefault();
        runItem(matches[active]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setMenu({ open: false, query: "", anchor: null });
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [menu.open, matches, active, runItem]);

  /* The pane is positioned from the caret, which moves when the page scrolls
     under it. Re-read the position rather than leave it behind. */
  useEffect(() => {
    if (!menu.open || !editor) return;
    const follow = () => trackSlash(editor);
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [menu.open, editor, trackSlash]);

  /* Escape leaves distraction-free mode. */
  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !menu.open) setFocusMode(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [focusMode, menu.open]);

  const words = editor?.storage.characterCount?.words?.() ?? 0;
  const minutes = readingTime(value);

  const body = (
    <div
      className={cn(
        "flex flex-col gap-2",
        focusMode && "fixed inset-0 z-50 overflow-y-auto bg-white p-6 lg:p-12",
      )}
    >
      <div
        className={cn(
          "rounded-input border bg-white",
          focusMode ? "mx-auto w-full max-w-canvas border-transparent" : "",
          invalid ? "border-danger" : focusMode ? "" : "border-border",
        )}
      >
        <TipTapCanvas
          editor={editor}
          className={cn("px-4 py-3.5", focusMode && "px-0 py-6")}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-fine text-muted">
        <span>
          {wordCount(value) || words} words · {minutes} min read
        </span>
        <span className="flex items-center gap-3">
          {uploading ? (
            <span aria-live="polite">Uploading an image…</span>
          ) : null}
          <button
            type="button"
            onClick={() => setFocusMode((v) => !v)}
            aria-pressed={focusMode}
            className="min-h-9 font-semibold text-blue transition-button hover:text-blue-hover"
          >
            {focusMode ? "Leave distraction-free mode" : "Distraction-free"}
          </button>
        </span>
      </div>

      {uploadError ? (
        <p role="alert" className="text-fine text-danger">
          {uploadError}
        </p>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void insertImage(file);
        }}
      />

      {focusMode ? (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          aria-label="Leave distraction-free mode"
          className="fixed top-4 right-4 flex size-11 items-center justify-center rounded-input bg-white text-ink-3 transition-button hover:text-blue"
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      {body}

      {editor ? (
        <>
          {/* The selection toolbar — design/26-admin-editor.html */}
          <BubbleMenu
            editor={editor}
            options={{ placement: "top" }}
            className="flex items-center gap-0.5 rounded-tile-sm bg-ink p-1.25 shadow-badge"
          >
            <ToolbarButton
              editor={editor}
              label="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <span className="text-small font-bold">B</span>
            </ToolbarButton>
            <ToolbarButton
              editor={editor}
              label="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <span className="text-small italic">I</span>
            </ToolbarButton>
            <ToolbarButton
              editor={editor}
              label="Link"
              active={editor.isActive("link")}
              onClick={() => {
                if (editor.isActive("link")) {
                  editor.chain().focus().unsetLink().run();
                  return;
                }
                const entered = window.prompt("Link address", "https://");
                const href = safeHref(entered);
                if (href) editor.chain().focus().setLink({ href }).run();
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              editor={editor}
              label="Inline code"
              active={editor.isActive("code")}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <span className="font-mono text-mono-label tracking-none">
                {"<>"}
              </span>
            </ToolbarButton>
            <span
              aria-hidden="true"
              className="mx-1 h-4.5 w-px bg-on-ink-panel"
            />
            <ToolbarButton
              editor={editor}
              label="Heading"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              wide
            >
              Heading
            </ToolbarButton>
            <ToolbarButton
              editor={editor}
              label="Sub-heading"
              active={editor.isActive("heading", { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              wide
            >
              Sub
            </ToolbarButton>
            <ToolbarButton
              editor={editor}
              label="Clear formatting"
              active={false}
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
              wide
            >
              Clear
            </ToolbarButton>
          </BubbleMenu>

          {/* The + button in the left margin of an empty line */}
          <FloatingMenu editor={editor} options={{ placement: "left-start" }}>
            <button
              type="button"
              aria-label="Insert a block"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setActive(0);
                setMenu({
                  open: true,
                  query: "",
                  anchor: new DOMRect(rect.left, rect.bottom, 0, 0),
                });
              }}
              className="mr-2.5 flex size-6.5 items-center justify-center rounded-tile-sm border border-blue bg-white text-blue transition-button hover:bg-accent-soft"
            >
              <Plus size={13} strokeWidth={2.2} />
            </button>
          </FloatingMenu>

          {menu.open && menu.anchor ? (
            <InsertPane
              items={matches}
              active={active}
              anchor={menu.anchor}
              onPick={runItem}
              onClose={() => setMenu({ open: false, query: "", anchor: null })}
            />
          ) : null}

          {editor.isActive("codeBlock") ? (
            <LanguagePicker editor={editor} />
          ) : null}
        </>
      ) : null}
    </>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
  wide = false,
}: {
  editor: Editor;
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-7.5 items-center justify-center rounded-input transition-button",
        wide ? "px-2.5 text-caption" : "w-7.5",
        active
          ? "bg-on-ink-panel text-white"
          : "text-on-ink-soft hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

/** The insert pane — design/26-admin-editor.html, opened by + or by "/". */
function InsertPane({
  items,
  active,
  anchor,
  onPick,
  onClose,
}: {
  items: InsertItem[];
  active: number;
  anchor: DOMRect;
  onPick: (item: InsertItem) => void;
  onClose: () => void;
}) {
  /* Keeps the pane on screen near the caret. */
  const top = Math.min(anchor.top + 8, window.innerHeight - 340);
  const left = Math.min(anchor.left, window.innerWidth - 320);

  return (
    <>
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default"
      />
      <div
        role="listbox"
        aria-label="Insert a block"
        style={{ top, left }}
        className="fixed z-50 flex max-h-85 w-75 flex-col gap-px overflow-y-auto rounded-tile border border-border bg-white p-2 shadow-badge"
      >
        <span className="px-2.5 pt-2 pb-1.5 font-mono text-mono-chip tracking-wide text-muted uppercase">
          Basic
        </span>
        {items.length === 0 ? (
          <span className="px-2.5 py-2 text-caption text-muted">
            Nothing matches.
          </span>
        ) : null}
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(item);
            }}
            className={cn(
              "flex items-center gap-2.75 rounded-input px-2.5 py-2.25 text-left transition-button",
              i === active ? "bg-accent-soft" : "hover:bg-tint",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-input",
                i === active ? "bg-white text-blue" : "bg-tint text-ink-3",
              )}
            >
              {item.icon}
            </span>
            <span className="flex flex-col">
              <span
                className={cn(
                  "text-caption font-semibold",
                  i === active ? "text-blue" : "text-ink",
                )}
              >
                {item.label}
              </span>
              {item.hint ? (
                <span className="text-fine text-muted-strong">{item.hint}</span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/** The language of the code block the caret is in. */
function LanguagePicker({ editor }: { editor: Editor }) {
  const current =
    (editor.getAttributes("codeBlock").language as string) ?? "text";
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <label
        htmlFor="code-language"
        className="text-fine font-semibold text-ink-3"
      >
        Code language
      </label>
      <select
        id="code-language"
        value={current}
        onChange={(e) =>
          editor
            .chain()
            .focus()
            .updateAttributes("codeBlock", { language: e.target.value })
            .run()
        }
        className="min-h-9 rounded-input border border-border bg-field px-2.5 text-caption text-ink"
      >
        {CODE_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {language}
          </option>
        ))}
      </select>
    </div>
  );
}
