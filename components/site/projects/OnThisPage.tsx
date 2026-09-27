"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * "On this page" — the block list in the rail of design/05-project-detail.html,
 * with the block being read in blue.
 *
 * The links work without JavaScript; the highlight is added after hydration by
 * watching which block crosses the upper part of the window. Desktop only:
 * below 1024px the rail sits under the case study, where a list of links to
 * what the reader has just scrolled past helps nobody.
 */
export function OnThisPage({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  const [current, setCurrent] = useState(items[0]?.id ?? "");
  /* A string, so a parent that rebuilds the array each render — the admin
     preview does, on every keystroke — does not restart the observer. */
  const ids = items.map((item) => item.id).join("|");

  useEffect(() => {
    const sections = ids
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      /* a band from 20% to 45% down the window counts as "being read" */
      { rootMargin: "-20% 0px -55% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [ids]);

  return (
    <nav
      aria-label="On this page"
      className="hidden flex-col gap-3 rounded-card border border-border bg-white p-6 lg:flex"
    >
      <span className="font-mono text-mono-chip tracking-wide text-muted uppercase">
        On this page
      </span>
      <ul className="flex flex-col gap-2.25 text-small">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={current === item.id ? "location" : undefined}
              className={cn(
                "transition-button hover:text-blue",
                current === item.id
                  ? "font-semibold text-blue"
                  : "text-ink-body",
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
