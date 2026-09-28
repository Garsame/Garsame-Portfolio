"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { EASE_ENTRANCE, PAGE } from "@/lib/motion";

/* True once mounted on the client, false on the server and on the render
   that hydrates it — so that render matches the server markup. Framer Motion
   needs this as a value, not an effect: `useSyncExternalStore`'s own snapshot
   check re-renders once hydration finishes, without a `setState` in an
   effect, which `react-hooks/set-state-in-effect` forbids. There is nothing
   to subscribe to, so `subscribe` never calls back. */
function noopSubscribe() {
  return () => {};
}
function useHasHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * The page transition — docs/02-DESIGN-SYSTEM.md: "outgoing fades over 250ms;
 * incoming fades in and rises 12px over 400ms. No slides or wipes."
 *
 * Lives in `app/(site)/layout.tsx`, not a template: a template remounts on
 * every navigation, which loses the outgoing tree before it can animate.
 * This component persists across navigations — only `usePathname()` changes —
 * so `AnimatePresence` can keep rendering the previous page while it fades
 * out. `mode="popLayout"` pulls the exiting page out of flow (position:
 * absolute) the moment it starts exiting, so the incoming page renders at
 * once rather than waiting 250ms for the exit to finish. See DECISIONS.md
 * D-024.
 *
 * It does NOT animate the first page load. Framer Motion writes `initial`
 * styles into the server-rendered HTML, so animating on first load meant the
 * entire page shipped at opacity 0 and stayed invisible until the JavaScript
 * had downloaded and hydrated — on Somali 3G that alone breaks the 2.5s LCP
 * target in CLAUDE.md. The first page renders at its final position; only
 * client-side navigations after that animate. See DECISIONS.md D-032.
 *
 * `hydrated` (see `useHasHydrated` above) is false on the server and on the
 * render that hydrates it, so that render matches the server-rendered markup.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const hydrated = useHasHydrated();

  if (reduced) {
    return <div data-reveal>{children}</div>;
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        data-reveal
        initial={hydrated ? { opacity: 0, y: PAGE.rise } : false}
        animate={{ opacity: 1, y: 0, transition: { duration: PAGE.inDuration, ease: EASE_ENTRANCE } }}
        exit={{ opacity: 0, transition: { duration: PAGE.outDuration, ease: EASE_ENTRANCE } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
