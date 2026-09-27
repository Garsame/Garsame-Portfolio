"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useAnimationControls,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { DURATION, EASE_ENTRANCE, REVEAL } from "@/lib/motion";

/**
 * The section reveal — docs/02-DESIGN-SYSTEM.md: "fade in, rise 16px, children
 * staggered 60ms. Fires once."
 *
 * Wrap a group in `Reveal` and its direct children in `RevealItem` to get the
 * stagger; use `Reveal` alone for a single element.
 *
 * Progressive enhancement, not a hidden-by-default fade:
 *
 * - The server HTML is always fully visible. Nothing waits on JavaScript.
 * - After hydration, an element that is still BELOW the fold is hidden — which
 *   the visitor cannot see, because it is off screen — and then revealed when
 *   it scrolls into view.
 * - An element already on screen at hydration is left alone.
 *
 * The earlier version used `initial="hidden"`, which Framer Motion writes into
 * the server HTML. Every section then shipped at opacity 0 and stayed blank
 * until the JavaScript arrived; on Somali 3G a visitor who scrolled before that
 * saw empty bands. See DECISIONS.md D-032.
 *
 * Reduced motion: nothing is ever hidden or moved.
 */

type RevealAs = "div" | "section" | "ul" | "li" | "header";

const hiddenState = { opacity: 0, y: REVEAL.rise };

export function Reveal({
  children,
  className,
  stagger = REVEAL.stagger,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Stagger between RevealItem children. Defaults to the 60ms in the spec. */
  stagger?: number;
  /** Delay before the group starts. */
  delay?: number;
  as?: RevealAs;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const armed = useRef(false);
  /* Fires a little before the element is fully on screen, so the movement is
     finished by the time it is being read. */
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  /* Arm only what starts below the fold. */
  useEffect(() => {
    if (reduced || !ref.current) return;
    if (ref.current.getBoundingClientRect().top > window.innerHeight) {
      armed.current = true;
      controls.set("hidden");
    }
  }, [reduced, controls]);

  useEffect(() => {
    if (inView && armed.current) controls.start("shown");
  }, [inView, controls]);

  /* motion[as] is a union of five element types, and TypeScript intersects
     their ref types into something no single ref satisfies. The ref is only
     used for getBoundingClientRect, which every one of them has, so the
     component is typed as the div variant. */
  const Component = motion[as] as typeof motion.div;

  return (
    <Component
      ref={ref}
      data-reveal
      className={className}
      animate={controls}
      variants={{
        hidden: hiddenState,
        shown: {
          opacity: 1,
          y: 0,
          transition: {
            duration: DURATION.reveal,
            ease: EASE_ENTRANCE,
            delay,
            staggerChildren: stagger,
          },
        },
      }}
    >
      {children}
    </Component>
  );
}

/**
 * A child of `Reveal`. It has no trigger of its own: the parent's variant
 * labels propagate to it, which is what produces the stagger.
 */
export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "p" | "span";
}) {
  const Component = motion[as];

  return (
    <Component
      data-reveal
      className={className}
      variants={{
        hidden: hiddenState,
        shown: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION.reveal, ease: EASE_ENTRANCE },
        },
      }}
    >
      {children}
    </Component>
  );
}
