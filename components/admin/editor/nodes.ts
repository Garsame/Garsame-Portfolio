import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { youtubeId } from "@/lib/editor-schema";
import { EmbedView } from "./EmbedView";
import { ImageView } from "./ImageView";

/**
 * The three blocks TipTap does not ship — docs/04-ADMIN.md's block list.
 *
 * Their attributes are exactly what lib/editor-schema.ts keeps when the
 * document is saved, so nothing typed here is silently dropped later. Both the
 * image and the embed are edited through a React node view, which is where
 * their alt text, caption, width and address are set.
 */

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    garsame: {
      setCallout: () => ReturnType;
      insertProjectImage: (attrs: {
        fileId: string;
        src: string;
        width: number;
        height: number;
        alt?: string;
      }) => ReturnType;
      insertEmbed: (attrs?: { url?: string }) => ReturnType;
    };
  }
}

/** The highlighted box — design/05-project-detail.html and design/26-admin-editor.html. */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-block="callout"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-block": "callout" }),
      0,
    ];
  },
  addCommands() {
    return {
      setCallout:
        () =>
        ({ commands }) =>
          commands.wrapIn(this.name),
    };
  },
  addKeyboardShortcuts() {
    return {
      /* Two Enters in an empty last paragraph leave the callout. */
      Backspace: () => {
        const { editor } = this;
        if (!editor.isActive(this.name) || !editor.state.selection.empty)
          return false;
        const { $from } = editor.state.selection;
        if ($from.parentOffset !== 0) return false;
        return editor.commands.lift(this.name);
      },
    };
  },
});

export const ProjectImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      fileId: { default: null },
      src: { default: null },
      width: { default: null },
      height: { default: null },
      alt: { default: "" },
      caption: { default: "" },
      /* "inline, wide, full-bleed" — docs/04-ADMIN.md */
      size: { default: "inline" },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-block="image"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(HTMLAttributes, { "data-block": "image" }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
  addCommands() {
    return {
      insertProjectImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

export const Embed = Node.create({
  name: "embed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      kind: { default: "link" },
      videoId: { default: null },
      title: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-block="embed"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-block": "embed" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(EmbedView);
  },
  addCommands() {
    return {
      insertEmbed:
        (attrs = {}) =>
        ({ commands }) => {
          const url = attrs.url ?? "";
          const video = youtubeId(url);
          return commands.insertContent({
            type: this.name,
            attrs: {
              url,
              kind: video ? "youtube" : "link",
              videoId: video,
              title: "",
            },
          });
        },
    };
  },
});
