import Image from "next/image";
import type { EditorNode } from "@/lib/editor-content";
import { safeHref, safeImageSrc } from "@/lib/editor-schema";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";

/**
 * Renders a stored editor document as page markup.
 *
 * React elements, never an HTML string: every text node is escaped by React,
 * so nothing typed into the admin can become markup on the page, and link
 * targets are checked again here on the way out — docs/04-ADMIN.md, "Sanitise
 * all editor HTML on output". Unknown node types render nothing.
 *
 * This covers the blocks the Phase 6 textareas can write. Phase 7 builds the
 * full renderer — images, code blocks, embeds, anchors for the table of
 * contents — on the same pattern.
 *
 * No hooks and no browser APIs, so it renders on the server for the public
 * page and in the browser for the admin's page preview alike.
 */

type Props = {
  doc: EditorNode | null | undefined;
  className?: string;
  /** Give headings the ids a table of contents links to — Phase 8's blog. */
  anchors?: boolean;
};

function Marks({ node }: { node: EditorNode }) {
  let out: React.ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "code":
        out = (
          <code className="rounded-chip bg-accent-soft px-1.5 py-0.5 font-mono text-ink-2">
            {out}
          </code>
        );
        break;
      case "italic":
        out = <em>{out}</em>;
        break;
      case "bold":
        out = <strong className="font-bold text-ink-2">{out}</strong>;
        break;
      case "link": {
        const href = safeHref(mark.attrs?.href);
        if (href) {
          const external = /^https?:/i.test(href);
          out = (
            <a
              href={href}
              className="font-medium text-blue underline decoration-blue-pale underline-offset-3 transition-button hover:text-blue-hover hover:decoration-blue"
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {out}
            </a>
          );
        }
        break;
      }
    }
  }
  return <>{out}</>;
}

function Inline({ nodes }: { nodes: EditorNode[] | undefined }) {
  return (
    <>
      {(nodes ?? []).map((node, i) =>
        node.type === "hardBreak" ? (
          <br key={i} />
        ) : node.type === "text" ? (
          <Marks key={i} node={node} />
        ) : null,
      )}
    </>
  );
}

type Anchor = (node: EditorNode) => string | undefined;

function Block({ node, anchor }: { node: EditorNode; anchor?: Anchor }) {
  switch (node.type) {
    case "paragraph":
      return node.content?.length ? (
        <p>
          <Inline nodes={node.content} />
        </p>
      ) : null;

    case "heading": {
      /* The anchor lib/editor-content.ts gave this heading in the table of
         contents, so a link from the rail lands on it. */
      const id = anchor ? anchor(node) : undefined;
      return Number(node.attrs?.level) === 3 ? (
        <h4 id={id} className="scroll-mt-rail-top pt-2 text-h3 text-ink">
          <Inline nodes={node.content} />
        </h4>
      ) : (
        <h3
          id={id}
          className="scroll-mt-rail-top pt-3 text-h2-sm text-ink lg:text-h2"
        >
          <Inline nodes={node.content} />
        </h3>
      );
    }

    case "bulletList":
    case "orderedList": {
      const List = node.type === "bulletList" ? "ul" : "ol";
      return (
        <List
          className={cn(
            "flex flex-col gap-2 pl-5.5 marker:text-muted",
            node.type === "bulletList" ? "list-disc" : "list-decimal",
          )}
        >
          {(node.content ?? []).map((item, i) => (
            <li key={i} className="pl-1">
              {(item.content ?? []).map((child, j) =>
                child.type === "paragraph" ? (
                  <Inline key={j} nodes={child.content} />
                ) : (
                  <Block key={j} node={child} anchor={anchor} />
                ),
              )}
            </li>
          ))}
        </List>
      );
    }

    case "callout":
    case "blockquote":
      /* design/05-project-detail.html: the tint box with a blue rule */
      return (
        <div className="flex flex-col gap-3 rounded-r-tile-sm border-l-3 border-blue bg-tint px-6 py-5 text-body-lg leading-loose text-ink-2">
          {(node.content ?? []).map((child, i) => (
            <Block key={i} node={child} anchor={anchor} />
          ))}
        </div>
      );

    case "codeBlock": {
      const code = (node.content ?? []).map((c) => c.text ?? "").join("");
      const language = String(node.attrs?.language ?? "text");
      return code ? <CodeBlock code={code} language={language} /> : null;
    }

    case "image": {
      const src = safeImageSrc(node.attrs?.src);
      const width = Number(node.attrs?.width);
      const height = Number(node.attrs?.height);
      if (!src || !width || !height) return null;
      const size = String(node.attrs?.size ?? "inline");
      const caption = String(node.attrs?.caption ?? "");
      return (
        <figure
          className={cn(
            "flex flex-col gap-2",
            /* "inline, wide, full-bleed" — the wider two break the measure. */
            size === "wide" && "lg:-mx-15",
            size === "full" && "lg:-mx-30",
          )}
        >
          <div className="overflow-hidden rounded-tile bg-accent-soft">
            <Image
              src={src}
              width={width}
              height={height}
              alt={String(node.attrs?.alt ?? "")}
              sizes={
                size === "inline" ? "(min-width: 1024px) 680px, 100vw" : "100vw"
              }
              className="h-auto w-full"
            />
          </div>
          {caption ? (
            <figcaption className="text-caption text-ink-body">
              {caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }

    case "embed": {
      const url = safeHref(node.attrs?.url);
      if (!url) return null;
      const videoId = String(node.attrs?.videoId ?? "");
      const title = String(node.attrs?.title ?? "");
      if (node.attrs?.kind === "youtube" && /^[\w-]{11}$/.test(videoId)) {
        return (
          <div className="aspect-video overflow-hidden rounded-tile bg-ink">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={title || "Video"}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        );
      }
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-1 rounded-tile border border-border bg-tint-soft px-5 py-4 transition-card hover:border-border-strong"
        >
          <span className="text-body font-bold text-ink">
            {title || "Read this"}
          </span>
          <span className="truncate font-mono text-mono-meta font-regular tracking-none text-blue">
            {url}
          </span>
        </a>
      );
    }

    case "horizontalRule":
      return <hr className="border-border" />;

    default:
      return null;
  }
}

export function EditorContent({ doc, className, anchors = false }: Props) {
  if (!doc?.content?.length) return null;

  /* Headings get the same anchors tableOfContents() hands out, in the same
     order, so a contents list and the page agree. */
  const used = new Set<string>();
  const anchor: Anchor | undefined = anchors
    ? (node) => {
        const text = (node.content ?? [])
          .map((c) => c.text ?? "")
          .join("")
          .trim();
        if (!text) return undefined;
        const base = slugify(text) || "section";
        let id = base;
        for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
        used.add(id);
        return id;
      }
    : undefined;

  return (
    <div className={cn("flex flex-col gap-4.5", className)}>
      {doc.content.map((node, i) => (
        <Block key={i} node={node} anchor={anchor} />
      ))}
    </div>
  );
}
