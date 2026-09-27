"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The stack tags — design/28-admin-project-editor.html: mono chips with a ×,
 * and a dashed "+ add" at the end.
 *
 * Type a tag and press Enter or a comma. Backspace in the empty box removes the
 * last one. The server trims, de-duplicates and caps them again.
 */
export function TagInput({
  id,
  tags,
  onChange,
  max = 20,
  invalid = false,
  describedBy,
}: {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [draft, setDraft] = useState("");

  /* All at once, so several tags pasted as "a, b, c" are all kept. */
  const add = (...values: string[]) => {
    const next = [...tags];
    for (const value of values) {
      const tag = value.trim().slice(0, 40);
      if (!tag || next.length >= max) continue;
      if (next.some((t) => t.toLowerCase() === tag.toLowerCase())) continue;
      next.push(tag);
    }
    if (next.length !== tags.length) onChange(next);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.25 pt-1">
      <ul className="contents">
        {tags.map((tag) => (
          <li
            key={tag}
            className="flex items-center rounded-chip bg-border-faint font-mono text-mono-meta font-regular tracking-none text-ink-3"
          >
            <span className="py-1.5 pl-2.25">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="-my-2.25 flex min-h-11 items-center px-2 text-muted transition-button hover:text-danger"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {tags.length < max ? (
        /* The dashed box is drawn 28px tall; the label around it is the 44px
           tap target, and a tap anywhere in it focuses the box. */
        <label htmlFor={id} className="-my-2 flex min-h-11 items-center">
          <input
            id={id}
            value={draft}
            onChange={(e) => {
              const v = e.target.value;
              if (v.includes(",")) {
                const parts = v.split(",");
                add(...parts.slice(0, -1));
                setDraft(parts.at(-1) ?? "");
              } else {
                setDraft(v);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add(draft);
                setDraft("");
              } else if (e.key === "Backspace" && !draft && tags.length > 0) {
                onChange(tags.slice(0, -1));
              }
            }}
            onBlur={() => {
              add(draft);
              setDraft("");
            }}
            placeholder="+ add"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(
              "min-h-7 w-24 rounded-chip border border-dashed bg-transparent px-2.25 py-1.5 font-mono text-mono-meta font-regular tracking-none text-ink outline-none placeholder:text-muted focus-visible:border-blue",
              invalid ? "border-danger" : "border-blue-wash",
            )}
          />
        </label>
      ) : null}
    </div>
  );
}
