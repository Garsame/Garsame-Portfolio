/**
 * Motion values, from docs/02-DESIGN-SYSTEM.md.
 *
 * Framer Motion needs numbers in seconds, so these cannot be read from the CSS
 * custom properties at runtime. They are the same values as the
 * `--duration-*`, `--ease-*` and `--reveal-*` tokens in styles/tokens.css, and
 * the two must be changed together.
 *
 * "One easing for entrances. Nothing overshoots or bounces." There is exactly
 * one curve here, and no spring anywhere in the project.
 */

/** cubic-bezier(0.22, 1, 0.36, 1) */
export const EASE_ENTRANCE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  /** hover, focus */
  hover: 0.15,
  /** elements entering and leaving; the nav sheet */
  move: 0.25,
  /** section reveals */
  reveal: 0.4,
  /** page transitions */
  page: 0.6,
  /** button press to 0.98 */
  press: 0.1,
} as const;

export const REVEAL = {
  /** section reveal rises 16px */
  rise: 16,
  /** children staggered 60ms */
  stagger: 0.06,
  /** hero children 80ms apart */
  heroStagger: 0.08,
} as const;

export const PAGE = {
  /** incoming page rises 12px */
  rise: 12,
  /** incoming fades in and rises over 400ms */
  inDuration: 0.4,
  /** outgoing fades over 250ms */
  outDuration: 0.25,
} as const;

export const SHEET = {
  /** the mobile nav sheet rises 8px */
  rise: 8,
  /** over 250ms */
  duration: DURATION.move,
} as const;

/** The section reveal, applied to a container whose children stagger in. */
export const revealContainer = {
  hidden: {},
  shown: {
    transition: { staggerChildren: REVEAL.stagger },
  },
} as const;

export const revealChild = {
  hidden: { opacity: 0, y: REVEAL.rise },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.reveal, ease: EASE_ENTRANCE },
  },
} as const;

/**
 * The rotating headline word — docs/02-DESIGN-SYSTEM.md: "fade out 200ms, fade
 * in 300ms, hold 2.5s". The CSS side lives in the word-in / word-out utilities.
 */
export const WORD = {
  /** How long the first word is shown before the rotation starts. */
  holdMs: 2500,
  /** Out, then in, then hold — the time between one word and the next. */
  cycleMs: 200 + 300 + 2500,
} as const;
