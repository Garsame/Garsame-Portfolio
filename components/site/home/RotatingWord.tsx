"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { WORD } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The last phrase of the hero headline, rotating — docs/02-DESIGN-SYSTEM.md:
 * fade out 200ms, fade in 300ms, hold 2.5s.
 *
 * Three things this is careful about:
 *
 * 1. No layout shift. Every word is rendered into the same grid cell, so the
 *    box is always as wide as the widest word and the line never reflows —
 *    even on a phone where "depends on" would otherwise wrap differently from
 *    "runs on". The fades are pure opacity.
 *
 * 2. It runs once, not forever. The same document forbids "infinite loops" and
 *    "anything that moves without being asked". The rotation goes through each
 *    word and settles back on the first, which is the version the server
 *    renders and the one search engines read. DECISIONS.md D-033.
 *
 * 3. Screen readers hear one sentence. The first word stays in the
 *    accessibility tree whichever word is showing; the others are
 *    aria-hidden, so the heading is never announced as changing.
 *
 * Reduced motion: it never starts.
 */
export function RotatingWord({
  words,
  className,
}: {
  words: string[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || words.length < 2) return;

    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    const advance = () => {
      step += 1;
      setIndex(step % words.length);
      /* After the last word, step % length is 0 again: stop there. */
      if (step < words.length) timer = setTimeout(advance, WORD.cycleMs);
    };

    timer = setTimeout(advance, WORD.holdMs);
    return () => clearTimeout(timer);
  }, [reduced, words.length]);

  return (
    <span className={cn("inline-grid", className)}>
      {words.map((word, i) => (
        <span
          key={word}
          aria-hidden={i === 0 ? undefined : true}
          className={cn(
            "col-start-1 row-start-1 whitespace-nowrap",
            i === index ? "word-in" : "word-out",
          )}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
