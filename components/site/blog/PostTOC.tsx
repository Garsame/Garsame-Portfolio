"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/editor-content";

export function PostTOC({ toc }: { toc: TocEntry[] }) {
  const [activeAnchor, setActiveAnchor] = useState<string>("");

  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveAnchor(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -65% 0px", threshold: 0.1 },
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.anchor);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="flex flex-col gap-3">
      <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
        ON THIS PAGE
      </span>
      <div className="flex flex-col gap-2.5 border-l-2 border-border pl-4 text-small">
        {toc.map((item) => {
          const isActive = activeAnchor === item.anchor;
          return (
            <a
              key={item.anchor}
              href={`#${item.anchor}`}
              className={`transition-colors ${
                isActive
                  ? "-ml-[18px] border-l-2 border-blue pl-4 font-semibold text-blue"
                  : "text-ink-body hover:text-blue"
              } ${item.level === 3 ? "pl-2" : ""}`}
            >
              {item.text}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
