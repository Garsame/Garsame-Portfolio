"use client";

import { useState } from "react";

/**
 * A code block — design/07-blog-post.html: ink card, the language on the left,
 * a copy button on the right.
 *
 * Public pages render code in one colour, as the design draws it. The colours
 * of syntax highlighting exist only in the editor, where they help while
 * writing; shipping a highlighter to every reader would cost more than it is
 * worth on Somali mobile data. DECISIONS.md D-081.
 */
export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-2.5 overflow-hidden rounded-tile bg-ink px-6.5 py-5.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-mono-meta font-regular tracking-none text-on-ink-label">
          {language === "text" ? "code" : language}
        </span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
          className="min-h-9 font-mono text-mono-meta font-regular tracking-none text-on-ink-label transition-button hover:text-white"
        >
          <span aria-live="polite">{copied ? "copied" : "copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto">
        <code className="font-mono text-mono-code text-code-text">{code}</code>
      </pre>
    </div>
  );
}
