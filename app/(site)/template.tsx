"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_ENTRANCE, PAGE } from "@/lib/motion";

/**
 * The page transition — docs/02-DESIGN-SYSTEM.md: "incoming fades in and rises
 * 12px over 400ms. No slides or wipes."
 *
 * A `template` rather than a `layout` because Next remounts a template on every
 * navigation, which is what gives each page a fresh enter animation.
 *
 * It does NOT animate the first page load. Framer Motion writes `initial`
 * styles into the server-rendered HTML, so animating on first load meant the
 * entire page shipped at opacity 0 and stayed invisible until the JavaScript
 * had downloaded and hydrated — on Somali 3G that alone breaks the 2.5s LCP
 * target in CLAUDE.md. The first page renders at its final position; only
 * client-side navigations after that fade in. See DECISIONS.md D-032.
 *
 * `hydrated` is module state, and only ever flips in an effect, which never
 * runs on the server — so every server render, and the first client render
 * that must match it, sees `false`.
 *
 * The outgoing fade is not implemented — see DECISIONS.md D-024.
 */

let hydrated = false;

export default function SiteTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const animateIn = hydrated && !reduced;

  useEffect(() => {
    hydrated = true;
  }, []);

  return (
    <motion.div
      data-reveal
      initial={animateIn ? { opacity: 0, y: PAGE.rise } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: PAGE.inDuration, ease: EASE_ENTRANCE }}
    >
      {children}
    </motion.div>
  );
}
