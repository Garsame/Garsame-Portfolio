# 02 — Design System

Every value here is a token. Components reference tokens, never raw values.

## Colour

```css
:root {
  /* surfaces */
  --white:          #FFFFFF;
  --tint:           #F5F7FE;   /* alternating section background */
  --tint-soft:      #F7F9FF;   /* form panels, inset cards */
  --accent-soft:    #EDF0FE;   /* icon tiles, image placeholders */
  --accent-wash:    #E8EDFD;   /* full-bleed break band */

  /* ink */
  --ink:            #0E1533;   /* headings, dark band background */
  --ink-2:          #3C4870;   /* strong body */
  --body:           #64708F;   /* body text */
  --muted:          #97A2C0;   /* metadata, labels */
  --faint:          #B6C0DE;   /* numbers, disabled */

  /* accent */
  --blue:           #3D5AF1;
  --blue-hover:     #2B45D6;
  --blue-light:     #7B90FF;   /* accent on dark backgrounds */
  --blue-pale:      #B9C6F5;

  /* lines */
  --border:         #E4E8F7;
  --border-strong:  #DDE3FA;
  --border-header:  #EEF1FB;

  /* status */
  --success:        #1A7F4B;   --success-bg: #E6F5ED;
  --warning:        #B4690E;   --warning-bg: #FBF1E3;
  --danger:         #C0342B;   --danger-bg:  #FBEAE9;
}
```

**Section background rhythm.** No two neighbouring sections share a background.
The order down the home page is: gradient → blue → tint → white → tint →
accent-wash → white → tint → white → tint → white → ink → white → tint footer.

**The ink band** (`--ink`) is used exactly twice on the home page: the
membership section and the "your turn" testimonial card. Used more, it stops
being a signature.

## Typography

```
Display / headings / body : 'Plus Jakarta Sans'  400 500 600 700 800
Mono / labels / metadata  : 'IBM Plex Mono'      400 500 600
```

Load with `next/font/google`. Fallback: `system-ui, sans-serif` and
`ui-monospace, monospace`.

| Level | Size | Weight | Line height | Tracking |
|---|---|---|---|---|
| Display | 52px | 800 | 1.12 | -0.035em |
| H1 | 40px | 800 | 1.18 | -0.03em |
| H2 | 30px | 700 | 1.25 | -0.025em |
| H3 | 20px | 700 | 1.35 | -0.02em |
| Body large | 16px | 400 | 1.7 | 0 |
| Body | 15px | 400 | 1.7 | 0 |
| Small | 14px | 400 | 1.6 | 0 |
| Caption | 13px | 400 | 1.5 | 0 |
| Mono label | 12px | 500 | 1.4 | 0.14em, uppercase |
| Mono meta | 11px | 500 | 1.4 | 0.08em |

Mobile: Display 36px, H1 30px, H2 24px. Article body 17px.

**Section eyebrow.** Every section opens with a mono label prefixed by `//` in
`--blue`, then the heading. In the heading, the final phrase is wrapped in
`--blue`. This pattern is mandatory and is what gives the long page its rhythm.

**Article measure.** Blog and project body text is capped at 680px.

## Space

4px base. Scale: 4, 8, 12, 16, 20, 24, 32, 44, 60, 92, 120.

- Section padding: `92px 120px` desktop, `56px 24px` mobile
- Content max width 1200px; page gutter 120px desktop, 24px mobile
- Grid gap between cards: 20px

## Shape

| Element | Radius |
|---|---|
| Cards, panels | 14px |
| Forms, inputs | 8px |
| Icon tiles | 12px |
| Chips, status badges | 5px |
| Avatars, circles | 50% |

**Shadow.** One only: `0 1px 2px rgba(14,21,51,0.04)` on cards. Floating hero
badges use `0 10px 30px rgba(14,21,51,0.09)`. Nothing else casts a shadow.

## The signature — the clipped corner

The top-right corner is cut at 45°, applied with `clip-path`:

```css
clip-path: polygon(0 0, calc(100% - Npx) 0, 100% Npx, 100% 100%, 0 100%);
```

| Element | N |
|---|---|
| Primary / secondary button | 13px |
| Small button, nav CTA | 11px |
| `v3` badge | 6px |

**It goes on buttons and the `v3` badge only.** Cards, panels, inputs and
images stay plain rounded. This restraint is the point — the cut reads as a
signature because it appears in one place.

Secondary (outlined) buttons need a two-layer wrapper: an outer div in
`--border-strong` with 1px padding and the clip, an inner div in `--white` with
the clip one pixel smaller.

## No section numbering

There is no numbered spine: no vertical line down the left of the page and no
section numbers beside it, on any page. Removed at Garsame's request on
16 September 2026 — see `DECISIONS.md` D-044. The approved files in `design/`
still draw it; ignore that part of them.

## Index tags

Mono, small, threaded through the site:

- Projects: `/ 001`, `/ 002`
- Blog posts: `# 012`
- Promise items: `/ 001`
- Process steps: `STEP 01`
- Service cards: `01` in the top-right of the card

## Motion

One easing for entrances: `cubic-bezier(0.22, 1, 0.36, 1)`. Nothing overshoots
or bounces.

| Duration | Use |
|---|---|
| 150ms | hover, focus |
| 250ms | elements entering and leaving |
| 400ms | section reveals |
| 600ms | page transitions |

- **Page transition** — outgoing fades over 250ms; incoming fades in and rises
  12px over 400ms. No slides or wipes.
- **Section reveal** — fade in, rise 16px, children staggered 60ms. Fires once.
- **Hero entrance** — status line, heading, paragraph, buttons, proof row,
  80ms apart.
- **Hero headline** — the last phrase rotates through: `Health Care`,
  `Transport`, `Retail`, `Hiring`. Fade out 200ms, fade in 300ms, hold 2.5s.
- **Cards** — border darkens to `--border-strong`, lift 2px, cover image scales
  to 1.02, over 200ms.
- **Links** — underline grows from the left, 180ms.
- **Buttons** — press to 0.98 scale over 100ms.

Forbidden: parallax, infinite loops, auto-playing carousels, counting numbers,
anything that moves without being asked.

`prefers-reduced-motion: reduce` makes every reveal instant and stops the
headline rotation.

## Breakpoints

640 · 768 · 1024 · 1280

At mobile width: nav collapses to a sheet, all grids become one
column, the hero circles scale to 78%, section padding drops to `56px 24px`.

## Accessibility

- Body text contrast 4.5:1 minimum, large text 3:1
- Visible focus ring: 2px `--blue`, 2px offset
- Tap targets 44px minimum
- Every image has alt text; decorative images get `alt=""`
- The FAQ accordion, the nav sheet and the admin editor are keyboard operable
