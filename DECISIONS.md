# Decisions

Choices made where `docs/` was silent, where two documents disagreed, or where
the framework forced a deviation from what a document describes.

Per `CLAUDE.md`: when something is genuinely not in the docs, make the simplest
choice consistent with the rules and record it here rather than stopping.

---

## Phase 0

### D-001 — Testimonials: the ink card alone, never placeholder quotes

`design/01-home.html` section 09 shows two testimonial cards holding bracketed
placeholder text. `docs/03-PAGES.md` says the opposite: "If fewer than two are
published, fill the row with the ink card only — never with placeholder
quotes."

**The document wins.** `CLAUDE.md` rule 10 ("never invent content") and rule 6
("nothing user-submitted appears publicly without admin approval") both point
the same way, and a placeholder quote on a live site reads as a fabricated
client. The bracketed cards in the design file are a layout sketch, not
approved content.

### D-002 — "Working with" row: four client names

`design/01-home.html` section 08 lists five names, including Save the Children.
`docs/01-PROJECT-BRIEF.md` describes Save the Children as a v1 NGO employer,
not a client.

The clients list seeds as **Heelan Home Health Care, MGH, Hormuud University,
Carshi Restaurant**. Save the Children stays in the v1 paragraph of the three
versions section, where it is accurate. The list is editable in Settings, so
this is reversible without a code change.

### D-003 — Next.js 16, and `middleware` is now `proxy`

The stack is locked to Next.js but no version is named, so this is built on the
current release, **Next.js 16.3.5** with React 19.2.

`docs/06-BUILD-PROMPTS.md` Phase 5 says to protect `/admin` and `/api/admin`
"with middleware, not only in the UI". In Next.js 16 the `middleware.ts`
convention is renamed to **`proxy.ts`**, and the exported function is `proxy`.
The edge runtime is not available there; `proxy` runs on Node.

**Phase 5 will use `proxy.ts`.** The intent in the document — route protection
at the request boundary rather than in the UI — is unchanged. Worth knowing
before reading Phase 5 against the spec.

Other Next 16 changes that land in later phases: `params` and `searchParams`
are async, `next lint` is removed in favour of calling `eslint` directly, and
several `next/image` defaults changed.

### D-004 — Tailwind 4, and the defaults are deliberately cleared

Tailwind 4 has no `tailwind.config.ts`; the theme is declared in CSS with
`@theme`. All tokens live in `styles/tokens.css`.

`@theme` clears Tailwind's own palette, type scale, fonts, breakpoints and
shadows with `--color-*: initial` and friends. `bg-blue-500`, `text-xl` and
`shadow-lg` therefore do not generate at all.

This is on purpose: it turns `CLAUDE.md` rule 1 and the START-HERE rule about
never substituting a framework default into something the build enforces rather
than something a reviewer has to catch.

Radius is the one namespace left un-cleared, so that `rounded-full` keeps
working for avatars and the hero circles. The four named radii
(`rounded-card`, `rounded-input`, `rounded-tile`, `rounded-chip`) are the house
style.

### D-005 — `@theme static`, so every token exists at runtime

By default Tailwind 4 only emits the CSS custom properties that a generated
utility actually uses. That silently dropped `--ease-entrance`, the radii and
the container widths from the stylesheet.

`@theme static` emits all of them. Phase 0 asks for the tokens to exist as a
CSS custom property block, and Framer Motion (Phase 2) reads the easing and
durations as variables where Tailwind cannot see the usage.

### D-006 — Tokens added beyond `docs/02-DESIGN-SYSTEM.md`

The design system names 24 colours. The approved screens use 70. Per rule 1
("if a value is missing from the token file, add it there first"), the
remainder were read out of `design/` and named by role, each with a comment
naming the file it came from. The significant additions:

| Token                  | Value     | Role                                  |
| ---------------------- | --------- | ------------------------------------- |
| `--color-ink-3`        | `#4A5573` | labels, nav items, form labels        |
| `--color-muted-strong` | `#7D89AE` | client names, admin icon strokes      |
| `--color-field`        | `#F8FAFF` | input fill, spine number backing      |
| `--color-border-faint` | `#F1F4FD` | table rows, chart gridlines           |
| `--color-blue-wash`    | `#C9D2F7` | pale rules, quote marks, avatar stack |
| `--color-prose`        | `#2B3453` | long-form article body                |
| `--color-neutral-bg`   | `#EEF1F9` | the fourth status family, "Concept"   |

Also tokenised: the hero circle fills, the on-ink and on-blue text colours, the
placeholder-artwork greys, and the dark-surface status pair used by the project
detail header.

`--color-ink-line: #2A3358` and `--color-on-blue-muted: #B9C6FF` appear in the
design system prose but not in its `:root` block; they are tokens now.

`#EDEFF5` is **not** a token: it is the grey behind the 1440px frame in the
design files, part of the preview chrome rather than the site.

### D-007 — The wordmark and the v3 chip are tokens

The wordmark is 22px/800/-0.03em, which is not one of the named text levels,
and the chip's padding is `5px 8px` — off the 4px scale. START-HERE.md forbids
rounding to the grid, and rule 1 forbids raw values in components.

Both are therefore tokens: `--text-wordmark`, `--text-chip` and the
`--spacing-chip-*` group, with the footer and admin-sidebar variants alongside.
Phase 1 builds the Wordmark component from these and writes no numbers.

### D-008 — The clipped corner ships as utilities

`clip-corner`, `clip-corner-sm`, `clip-corner-nav`, `clip-corner-badge` and the
two `-inner` variants for the two-layer outlined button are defined once with
`@utility` in `styles/tokens.css`, so no component ever writes the polygon out.

Measured from `design/01-home.html`: the medium secondary button is a 13px
outer with a 12px inner; the small secondary is 12px outer, 11px inner. The
design system table gives 13px and 11px, which are the outer and the visible
inner respectively — consistent, once the two-layer wrapper is accounted for.

### D-009 — Spacing is in px, not rem

`--spacing: 4px`, so `p-1` is 4px and `p-30` is 120px. The whole design is
specified in px, and holding the scale in px keeps it exact regardless of the
root font size. Type is also in px for the same reason.

### D-010 — `docs/`, `design/` and the spec files are excluded from tooling

Prettier reformatted `docs/01-PROJECT-BRIEF.md`, `docs/02-DESIGN-SYSTEM.md` and
`START-HERE.md` on its first run — lowercasing every hex and repadding the
markdown tables. The files were restored and `docs/`, `design/`, `CLAUDE.md`,
`START-HERE.md` and `AGENTS.md` are now in `.prettierignore`. `design/` is also
in the ESLint ignore list.

The specification must not drift because a formatter touched it.

### D-011 — `AGENTS.md` is kept, the generated `CLAUDE.md` is not

`create-next-app` writes an `AGENTS.md` carrying Next 16 guidance and a pointer
to versioned docs in `node_modules/next/dist/docs/`, and `next dev` re-creates
it if deleted. It is kept.

It also writes a `CLAUDE.md` containing only `@AGENTS.md`. That was discarded —
this project's `CLAUDE.md` is the standing rules and must not be overwritten.

### D-012 — Git

The folder sat inside a repository rooted at the whole user profile
(`C:/Users/ICT-LAB 3`), so any commit risked staging unrelated files. `git init`
was run here, making `garsame-v3` its own repository.

`.env.example` is force-tracked with `!.env.example`, since the generated
`.gitignore` excludes all `.env*`.

---

## Phase 1

### D-013 — `completed` has no chip colour in the designs

`docs/05-DATA-MODEL.md` gives projects four states: `live`, `building`,
`completed`, `concept`. The approved screens draw only three chips — `live` on
the success family, `building` on warning, `concept` on the new neutral family.
`Completed` appears nowhere as a chip, only as a word in a settings dropdown.

It takes the **accent family** (`--color-accent-ink` on `--color-accent-soft`).
It reads as distinct from the green of "live", it is already a token, and it
avoids inventing a hue. Change it in `components/ui/Badge.tsx` if a different
reading is wanted.

Still open for Phase 6: the project detail header sits on the ink band, and
`design/05-project-detail.html` gives a dark chip pair for `building` only
(`--color-warning-on-ink` on `--color-warning-on-ink-bg`). The other three
on-ink pairs are not in the designs and will need deciding then.

### D-014 — a colour may never share a name with a type level

Tailwind generates `text-*` utilities from **both** the colour namespace and
the font-size namespace. `--color-body` and `--text-body` therefore both
compiled to `.text-body`, and the colour rule won outright: the built CSS
contained only `.text-body { color: … }`, so the Body type level — the most
used level in the project — was applying no size, line height or tracking at
all. It also meant `text-body` silently overrode any other text colour beside
it, which is how it was noticed: a ghost button came out grey instead of blue.

The colour is renamed **`--color-ink-body`**, joining the ink family. The type
level keeps the name the design system gives it, since rule 4 is about named
levels. So:

- `text-body` — the Body level, 15px / 1.7
- `text-ink-body` — the body text colour, `#64708F`

`docs/02-DESIGN-SYSTEM.md` still calls this colour `--body`. The document is
not wrong; the constraint is Tailwind's. Worth renaming it in the document to
keep the two in step — your call.

A guard against a repeat, worth running after adding any token:

```bash
comm -12 \
  <(grep -oE '^\s*--color-([a-z0-9-]+):' styles/tokens.css | sed -E 's/.*--color-([a-z0-9-]+):/\1/' | sort -u) \
  <(grep -oE '^\s*--text-([a-z0-9-]+):' styles/tokens.css | sed -E 's/.*--text-([a-z0-9-]+):/\1/' | sort -u)
```

Any output is a collision. It is currently empty.

### D-015 — transitions name `translate` and `scale`, not `transform`

Tailwind 4 writes movement to the individual `translate` and `scale` CSS
properties rather than to `transform`. A `transition: transform …` therefore
animates nothing, and the card lift and the button press would jump rather than
ease. The `transition-button`, `transition-card` and `transition-cover`
utilities name the real properties.

### D-016 — the clipped corner and the transitions are utilities, not classes in components

`clip-corner*`, `transition-button`, `transition-card` and `transition-cover`
are declared once with `@utility` in `styles/tokens.css`. The motion spec gives
each property its own duration — a button recolours over 150ms but presses over
100ms — which a single `transition duration-*` class cannot express, and the
clip polygon should exist in exactly one place.

### D-017 — Button sizes, and where the two clip values land

Measured from `design/01-home.html`:

| Variant      | Padding   | Clip (outer / inner) |
| ------------ | --------- | -------------------- |
| primary md   | 16px 28px | 13px                 |
| secondary md | 15px 26px | 13px / 12px          |
| primary sm   | 13px 22px | 12px                 |
| secondary sm | 12px 22px | 12px / 11px          |
| nav CTA      | 12px 22px | 11px                 |

The design system table lists 13px for primary/secondary and 11px for the small
button and nav CTA. Those are the outer cut and the visible inner cut
respectively — consistent once the two-layer wrapper is accounted for. The nav
value is kept as its own `clip-corner-nav` for the Phase 2 header.

Both `sm` and `md` clear the 44px minimum tap target: `sm` is 13 + 13 + 22.4 =
48.4px tall.

### D-018 — the select is native

`Select` renders a real `<select>` with the chevron from the design drawn over
it, rather than a custom listbox. It is keyboard and screen-reader correct
without any JavaScript, and on a phone it opens the platform picker instead of
shipping code to imitate one — which matters given the 3G LCP target.

### D-019 — `Wordmark` ships in Phase 1

Promised in D-007. `docs/01-PROJECT-BRIEF.md` says no logo is designed yet and
the wordmark plus `v3` chip _is_ the mark, so it is a UI primitive rather than a
one-off: the header, the footer, the admin sidebar, the login screen and the 404
all use it. Branding & Look (Phase 9) uploads a logo and falls back to this.

### D-020 — `/dev/ui` is noindex and outside the route groups

It lives at `app/dev/ui/page.tsx`, not in `app/(site)`, so it never picks up the
public header and footer, and it sets `robots: { index: false, follow: false }`.
It is a review surface, not a page of the site.

The `SectionSpine` demo on it sits outside `Container` on purpose: the spine
measures 72px from the edge of its own section, so showing it inside a 120px
gutter would put the line at 192px and read as broken.

---

## Phase 2

### D-021 — the shell metrics come from the ten pages, not from the home page

`design/01-home.html` draws the header and footer slightly larger than every
other screen. Ten of the eleven public designs agree with each other:

| Element            | Ten pages | design/01-home |
| ------------------ | --------- | -------------- |
| Header height      | 76px      | 84px           |
| Header wordmark    | 21px      | 22px           |
| Header nav gap     | 30px      | 32px           |
| Header CTA padding | 11px 20px | 12px 22px      |
| Footer padding     | 34px      | 42px           |
| Footer wordmark    | 18px      | 19px           |

`docs/03-PAGES.md` describes the header and footer but gives no measurements,
so the value is lifted from `design/`. The header is a single global component
and cannot be two sizes, so the majority wins. The home page was evidently
drawn first and the shell tightened afterwards.

The footer nav gap of 26px has only one source — `design/01-home.html` is the
only screen whose footer shows nav links at all, though `docs/03-PAGES.md` says
they belong there.

### D-022 — `cn` does not resolve conflicts, so same-property overrides need a wrapper

`cn` concatenates; Tailwind decides between two classes for the same property
by stylesheet order, not by argument order. So `<Button className="hidden
sm:inline-flex">` did **not** hide the button — `Button` sets `inline-flex` on
itself and won.

Found in the header, where the CTA was overflowing the bar at 390px. The fix is
a wrapper — `<span className="hidden sm:block"><Button /></span>` — not
`tailwind-merge`, which would be a new dependency for a problem with three
cheap answers. The rule and the three answers are written at the top of
`lib/utils.ts`.

### D-023 — the nav sheet stores a path, not a boolean

The header does not unmount between routes, so a `boolean` open state leaves
the sheet sitting over the newly navigated page. Closing it from an effect on
`pathname` is what `react-hooks/set-state-in-effect` exists to stop.

The sheet stores the pathname it was opened on and `open` is derived
(`openPath === pathname`), so it closes by itself on navigation — including on
a back-button navigation, which an `onClick` handler on each link would miss.

### D-024 — the page transition is the enter half only

**Superseded after Phase 13 — see D-135.** Left as written for the record of
why the first attempt only did half the spec.

`docs/02-DESIGN-SYSTEM.md` asks for the outgoing page to fade over 250ms and
the incoming one to fade in and rise 12px over 400ms.

The incoming half is implemented, in `app/(site)/template.tsx` — a `template`
rather than a `layout` because Next remounts a template on every navigation,
which is what gives each page a fresh enter animation.

**The outgoing fade is not implemented.** The App Router unmounts the old route
before the new one renders, so there is no outgoing tree left to animate.
Holding a copy of the old page to fade it out means intercepting every
navigation and rendering two route trees at once — a lot of machinery, and it
delays the new page by 250ms on a connection where 250ms is not free. The
alternative was to fake it with a slide or a wipe, which the same spec forbids.

Worth revisiting in Phase 12 if the transition feels abrupt; the honest state
today is half the spec.

### D-025 — a no-script rule keeps revealed content visible

Framer Motion writes its `initial` styles into the server-rendered HTML, so
every element inside `Reveal` ships at `opacity: 0`. If the JavaScript never
arrives, the page is blank.

`app/layout.tsx` carries a `<noscript>` block that forces `[data-reveal]`
visible. The content is in the DOM for crawlers either way; this is for a reader
whose JavaScript failed, which on Somali mobile data is a real case rather than
a hypothetical.

Every element rendered by `Reveal`, `RevealItem` and the page template carries
`data-reveal` for this reason.

### D-026 — the footer year is fixed, not computed

`new Date().getFullYear()` on the server opts the page out of static rendering,
which works against rule 3 and the LCP target, for a value that changes once a
year. It reads `© 2026 Garsame Mohamud`, matching the designs. Move it into
Settings in Phase 9 if it should be editable.

### D-027 — the 404 carries its own header and footer

A root `not-found.tsx` renders inside `app/layout.tsx` only; it does not pick up
the `(site)` group's layout. `design/11-404.html` shows the full shell, so
`Header` and `Footer` are repeated in the page itself.

Its circles are sized rather than scaled — 218px/164px below 1024px and
280px/210px above, the 78% reduction the design system gives the hero circles.
Left as absolute children of an unsized wrapper they overflowed their parent
and painted over the heading, because a positioned element paints above in-flow
content.

### D-028 — `Section` owns the tone and the spine together

The spine number has to sit on the section's own background for the line to
appear to break around it. If the background and the spine were set
independently they would drift apart the first time a section changed tone, so
`Section` maps one `tone` prop to the background, the spine colours **and** the
number's backing.

It is full-bleed, with `Container` inside it, because the spine measures 72px
from the edge of the section and not from inside the gutter.

The `pad` prop covers the bands that differ from the 92px default: the hero
(72/84), the blue promise band (54), the clients row (50) and the ink
membership band (74).

### D-029 — the route stubs hold no site copy

Every route in `docs/03-PAGES.md` exists and navigates, but each stub says which
phase builds it and lists what that page will contain, rather than carrying
placeholder marketing text. Rule 10 forbids invented content, and a stub that
reads like real copy is worse than one that admits what it is, because it can
be mistaken for approved text and shipped.

`components/site/RouteStub.tsx` is deleted once the last route is built.

### D-030 — both `[slug]` routes are dynamic for now

`/projects/[slug]` and `/blog/[slug]` build as server-rendered on demand. They
become statically generated in Phases 6 and 8, once there is a database to read
slugs from via `generateStaticParams`.

### D-031 — the nav collapses at 1280px, not at 1024px

`docs/02-DESIGN-SYSTEM.md` ties the spine to 1024px and says only that "at
mobile width the nav collapses to a sheet", without naming the width. Every
design file is drawn at 1440px, so there is nothing to measure.

At 1024px the header overflowed. Eight nav links plus the wordmark and the CTA
need about 886px; a 1024px viewport with the design's 120px gutters leaves 784px.
The three ways out were a narrower gutter, a tighter nav gap, or collapsing the
nav earlier. The first two change approved values at one width only, so the
sheet now covers everything below **1280px**.

The spine still appears at 1024px, exactly as the document specifies. Between
1024 and 1279 a visitor gets the spine and the sheet together, which is
consistent — both are the designed components, just at their own breakpoints.

Checked with no horizontal overflow at 390, 768, 1024, 1280 and 1440.

The menu trigger also lost a `-mr-2.5` that was optically aligning its 44px tap
target with the gutter: it pushed the button 10px outside its container and
showed up as real overflow.

---

## Phase 3

### D-032 — nothing ships invisible: the LCP fixes

Two Phase 2 components were hiding content behind JavaScript, which fails the
2.5s-on-3G LCP target in `CLAUDE.md`. Framer Motion writes its `initial` styles
into the server HTML, so anything using `initial={{ opacity: 0 }}` is invisible
until the JavaScript has downloaded and hydrated.

- **The page template** hid the entire page on first load. It now renders the
  first page at its final position; only client-side navigations after that
  fade in. A module-level `hydrated` flag, flipped in an effect that never runs
  on the server, tells the two apart.
- **`Reveal`** shipped every section at opacity 0, so a visitor who scrolled
  before the JavaScript arrived saw blank bands. It is now progressive
  enhancement: the server HTML is always visible, and after hydration only
  elements still below the fold are hidden (where nobody can see it happen) and
  then revealed on scroll.
- **The hero entrance** is CSS (`animate-enter`), not Framer Motion. The hero
  heading is the LCP element; a CSS animation starts on first paint with no
  JavaScript.

Checked: the server HTML for `/` contains **zero** elements at opacity 0.
Scrolling top to bottom with real wheel input at 1024px, no element fully on
screen was ever left hidden.

### D-033 — the rotating words, and why the headline is three lines

`docs/02-DESIGN-SYSTEM.md` lists the rotation as "Health Care, Transport, Retail,
Hiring". That does not complete the sentence: "your business Health Care".
`design/33-admin-branding.html` shows the approved editor with **runs on,
depends on, grows with**, which does, and matches `docs/03-PAGES.md`'s heading
"your business `runs on`" and the data model's `heroHeadingLine2Prefix` plus
`heroRotatingWords`. The branding screen wins; the design-system list looks left
over from an earlier headline.

**It runs once, not forever.** The same document forbids "infinite loops" and
"anything that moves without being asked". The rotation goes through each word
once and settles back on "runs on", the version the server renders.

**The consequence worth knowing.** Measured in the 572px column at 52px:

| Line 2                   | Width | Fits |
| ------------------------ | ----- | ---- |
| your business runs on    | 503px | yes  |
| your business grows with | 598px | no   |
| your business depends on | 615px | no   |

The approved words are too long for the approved size and column. Every word is
rendered into one grid cell so the box is always as wide as the longest — which
means the phrase sits on its own line even while "runs on" shows. The
alternative, letting the heading reflow on each change, makes the whole hero
jump by a line every three seconds, a layout shift. Stable was chosen.

To get the two-line headline from the design back, either drop the rotation or
choose rotating words no wider than "runs on". That is a copy decision.

### D-034 — the blog section shows bracketed placeholders, not the sample posts

`design/01-home.html` shows three posts with titles, dates, reading times and a
"# 012". None exists. Showing them would publish invented dates and a number
implying twelve posts — rule 10. Until Phase 8 the section renders the designed
card layout with bracketed content. The testimonials rule (D-001) is
`docs/03-PAGES.md`'s own; for the blog the document is silent, so rule 10's
bracketed-placeholder instruction applies.

### D-035 — the "What do you need?" options are the six services

Neither the designs nor the docs list the options. The six service titles plus
"Something else" are approved copy already, and they map an enquiry to a
service.

### D-036 — the ink card fills the row when it is alone

With fewer than two published testimonials, `docs/03-PAGES.md` has the ink card
fill the row. It spans the remaining columns — all three with none published,
two with one. A 1200px card holding a short vertical stack reads as empty, so
when it spans the full row it lays the invitation beside its button at desktop
width. With one published testimonial the quote still shows; nothing published
is ever hidden.

### D-037 — hero and break band below the design's width

The designs are all 1440px. Below it:

- **The hero is two columns from 1280px.** At 1024px the 120px gutters leave
  two 372px columns and the 460px circles do not fit in one. Below 1280 the art
  stacks under the text — the same breakpoint as the nav (D-031).
- **The hero art scales to 78% below 1024px**, per the design system. Every
  circle, the portrait and the badge offsets are computed from one
  `--hero-scale` variable, so the proportions hold exactly.
- **Below 640px each badge overhang is capped at 12px.** At 390px the "I reply
  in" badge ran 3px past the screen edge with its border clipped. Wider than
  640px the measured offsets apply unchanged — verified at 1440 against the
  design's 74/−10, 236/−22 and 44/−34.
- **The break band is 220px below 768px**, 340px above. A 340px band of
  screenshot on a phone is mostly cropping.

### D-038 — the avatar count is computed

`design/01-home.html` draws three avatars and "+2", against five names. With the
four real clients (D-002) it is "+1". It is computed from the clients list so it
cannot drift from it.

### D-039 — the process rules use `--blue-pale`, as the document says

`docs/03-PAGES.md`: "blue on step one, `--blue-pale` on the rest". The design
file draws `#C9D2F7`. Where a document names the value explicitly, the document
wins.

### D-040 — the FAQ is native `<details>`

Keyboard focusable, announced correctly and working before any JavaScript loads,
which matters on a slow connection. `name="faq"` makes the group exclusive.
First item open, blue border on the open one.

Verified: opening one closes the other, and Tab moves between questions.
**Not verified here:** toggling with Enter or Space. The browser tool sends Enter
without the character event and Space with an empty key, so neither reaches
the built-in activation of `<summary>`. The behaviour is defined by the HTML
spec; it is worth one manual check with a real keyboard.

### D-041 — one-pixel drift between screens snaps to the component size

The design is hand-drawn and a few components differ by a pixel between screens:
the ink card's button is 12px/20px against the header CTA's 11px/20px, the
membership inputs 14px/15px against the contact inputs' 15px/16px, the Join
button 15px against 16px. Components use their defined size, so a button looks
the same everywhere. Layout spacing between elements is still taken exactly.

The two form panels are drawn with a 16px radius; `docs/02-DESIGN-SYSTEM.md`
says panels are 14px. The document wins.

Section headings keep the 12px gap `SectionHeading` puts between eyebrow and
heading, where two sections draw 17px.

### D-042 — how spacing is written

With `--spacing: 4px`, every whole-pixel value is a scale step: 26px is
`p-6.5`, 13px is `gap-3.25`. One-off layout values measured from `design/` are
written that way. Reused component geometry — buttons, fields, chips, the hero
art — has named tokens. Arbitrary `[Npx]` values do not appear anywhere in the
components.

Grid track ratios lifted from the design, like `lg:grid-cols-[0.85fr_1.15fr]`,
are the one arbitrary form allowed: they are proportions, not sizes.

### D-043 — the promise band has no invented heading

The blue band has no heading in the design. An invisible screen-reader heading
would still be invented copy, so none was added; each promise title is an `h2`
instead, which keeps the page outline free of an h1 → h3 skip.

---

## After Phase 3

### D-044 — the numbered spine is removed, on every page

At Garsame's request on 16 September 2026: no vertical line down the left of
the page and no section numbers beside it, on the home page or on any page
built later.

Removed from the code: the `SectionSpine` component, the `number` prop on
`Section`, the spine spacing tokens (`--spacing-spine`,
`--spacing-spine-number`) and the two colours that existed only for it
(`--color-blue-band-line`, `--color-ink-line`).

Removed from the specification, so the documents and the code agree:
`docs/02-DESIGN-SYSTEM.md` (the "numbered spine" section, the `--blue-band-line`
colour and the mobile note) and `docs/06-BUILD-PROMPTS.md` (the SectionSpine
item in Phase 1, "and the spine" in Phase 2, "the spine numbers 01 to 13" in
Phase 3). The design system now says plainly that there is no section
numbering, and that the approved files in `design/` still draw it and should be
ignored on that point.

This supersedes the spine parts of D-020, D-028, D-031 and D-037, which are
left as they were written.

Not removed, because they are not the spine: the small index tags inside
sections — `/ 001` on the promise items and project cards, `01` on the service
cards, `STEP 01` on the process steps, `# 012` on blog cards. They are listed
separately in the design system under "Index tags".

---

## Phase 4

### D-045 — required to publish, not required to save

`docs/05-DATA-MODEL.md` marks the case-study fields of projects and posts
`required`. `docs/04-ADMIN.md` lists the same fields under "Required to
publish", and the editor autosaves drafts every few seconds — so a half-written
draft has to be saveable.

A draft needs only a **title** and a **slug** (generated from the title if not
typed). Everything else is checked the moment `state` becomes `published`, with
one message per missing field, so the admin can show all of them at once rather
than one at a time. The document stays a draft in the database if any are
missing.

Projects, to publish: client, year, type, status, summary, cover image, the
problem, what was built (a non-empty body) and at least one stack tag. Posts:
excerpt, cover image, category and a non-empty body.

### D-046 — reading time is 200 words a minute

At the slow end of the usual range on purpose. Much of this audience reads
English as a second or third language, and a "6 min read" that takes ten erodes
trust. Rounded up, never below one minute.

The table of contents takes editor Headings and Sub-headings (levels 2 and 3);
the post title is the page's h1. Every anchor is unique — duplicates become
`-2`, `-3`, checked against every anchor already issued. The Phase 7 renderer
must give each heading the anchor at the same position.

### D-047 — there can only be one admin

`docs/04-ADMIN.md`: "Garsame is the only admin. There is no public sign-up and
no second role." Enforced in the `User` model: creating a second user fails.
The account is changed, never duplicated.

The password is hashed with Node's built-in scrypt (N=2^17, r=8, p=1, per
OWASP), stored with its parameters so they can be raised later without breaking
the stored hash. No hashing library was added. The minimum length is 12
characters. `passwordHash` is never returned by a query unless asked for.

### D-048 — a scheduled post is a draft with a time

`docs/04-ADMIN.md` has "Draft · Published · Archived, plus schedule for later";
`docs/05-DATA-MODEL.md` has both `scheduledFor` and a three-value `state`. So a
scheduled post is `state: "draft"` with `scheduledFor` set, and the Phase 8 job
publishes it when the time comes.

Because it will go out with nobody looking, it must pass every publish rule at
the moment it is scheduled, and the time must be in the future. Publishing or
archiving clears `scheduledFor`. Broadcasts follow the same rule: nothing leaves
`draft` without a body, and `scheduled` needs a future time.

### D-049 — private fields are never loaded by default

The testimonial submitter's email ("private, never rendered publicly"), the
testimonial and contact IPs, the admin password hash and the stored SMTP
password are `select: false`. No query returns them unless it names them with
`.select("+email")`. A public page cannot leak a field it never loaded.

### D-050 — hero badges store a tone, and the icon follows from it

`docs/05-DATA-MODEL.md` stores `heroBadges [{ label, value, tone }]`, and
`docs/04-ADMIN.md` describes the editable parts as "label, value, icon colour".
There is no icon field. The icon follows from the tone — warning is the bolt,
success the tick, accent the clock — exactly as `design/01-home.html` pairs
them. Phase 9 maps it when the hero reads from settings.

### D-051 — the shape of `stats_daily`

The data model names the collection but not its fields. It holds the smallest
shape that answers the Stats module's questions: `date` (YYYY-MM-DD, Mogadishu
time), `path` (or `*` for the whole site), `views`, `sessions` and the top
referring hosts. One row per page per day, with a unique index, so re-running
the nightly job overwrites rather than double-counts.

`pageviews` stores the referrer as a host only — a full referring URL can carry
personal data in its query string — and has no field that could hold an IP or a
user agent.

### D-052 — rules run on save, and cannot be updated around

Publishing, the featured limits and the computed fields run in each model's
`pre("validate")` hook. That fires on `doc.save()` but **not** on `updateOne` or
`findOneAndUpdate` — a single `updateOne({ state: "published" })` would publish
an empty post past every rule.

So the fields those rules depend on are protected: a query update that touches
them is refused with a message saying to load the document and save it.
`insertMany` cannot create published or featured documents either. A deliberate
data migration can pass `{ allowProtectedFields: true }`.

| Model       | Protected fields                    |
| ----------- | ----------------------------------- |
| Project     | state, featured, body               |
| Post        | state, featured, body, scheduledFor |
| Testimonial | status, featured                    |
| Broadcast   | state, body                         |

Broadcast counters stay open to `$inc`, which is how the sending queue should
update them.

Also note for later phases: Mongoose 9 no longer passes `next` to pre hooks.
Hooks are plain or async functions that throw to fail.

### D-053 — the featured rules

- **Projects:** at most three; **posts:** at most one — enforced in the model,
  so no route can exceed them.
- Archiving a featured project or post unfeatures it, freeing the slot.
- A testimonial can only be featured once it is published, and un-publishing
  un-features it.

### D-054 — new items go to the top of the manual order

`docs/03-PAGES.md` shows projects "newest first within the admin's manual
order". A new project, and a newly published testimonial, takes the position
above the current first item; dragging reorders from there.

### D-055 — duplicate-key errors read as sentences

The save hooks check slugs before writing, but two saves at the same moment can
both pass that check. The database's unique index refuses one, and that refusal
arrives as MongoDB's raw `E11000`. Each model turns it into the same readable
error as its own checks — "That email address is already a member".

For Phase 10: on the public membership form, a duplicate email should not say
so. Telling a stranger an address is already subscribed leaks who is on the
list; the form should answer the same either way.

### D-056 — the seed and the checks

`npm run db:seed` builds every index, creates the settings document from the
approved copy in `lib/content/home.ts`, then creates the admin. It is safe to
re-run: it never overwrites an existing admin or edited settings.
`--reset-admin-password` sets a new password from the environment. Settings are
seeded before the admin, so a missing password does not also stop the content.

Bio, short and long, and social links are left empty rather than invented; the
phone stays empty and renders bracketed. The SMTP password is not seeded — it is
stored encrypted, and encryption arrives in Phase 10.

`npm run db:check` runs 37 checks against a database created for the run and
dropped afterwards; it never touches the database named in `MONGODB_URI`. To
confirm the checks can actually fail, two rules were broken on purpose — the
featured limit raised to four, and the protected-field guard removed — and the
run reported three failures before the originals were restored.

`tsx` was added as a development dependency to run the TypeScript scripts. It
is tooling, not part of the running site.

### D-057 — the file model is exported as `StoredFile`

A `File` export would shadow the web platform's `File` type, and the Phase 9
upload handlers need both — the uploaded `File` from a form and this model — in
the same module. The Mongoose model name is still `File`, which is what every
reference points at.

### D-058 — the domain is still needed

`START-HERE.md` lists the domain name as Phase 4's dependency. Nothing in the
data layer needed it, so the phase is complete without it; `NEXT_PUBLIC_SITE_URL`
is `http://localhost:3000` for now. It becomes necessary for canonical URLs,
the sitemap and the unsubscribe links in email.

---

## Phase 5

### D-059 — the sign-in lockout counts per address, not per account

`design/20-admin-login.html` says five failed attempts lock the page for
fifteen minutes. Each failure is one document in `loginattempts`, which
MongoDB deletes by itself fifteen minutes later (a TTL index). Before any
password is checked, five recent failures from the same client refuse the
attempt. A successful sign-in clears that client's failures.

The lock is per address, not per account. With only one account, a per-account
lock would let anyone lock Garsame out of his own admin by typing wrong
passwords for his email.

No address is stored. The key is a SHA-256 of the address and `AUTH_SECRET`,
cut to 32 characters. The same address always gives the same key, but the key
cannot be turned back into an address. This follows D-051, where page views
have no field that could hold one.

The lock message is the same whatever email was typed.

### D-060 — sessions are encrypted cookies that last seven days

Auth.js's JWT strategy: the session is an encrypted, httpOnly cookie. There is
no sessions collection, and `docs/05-DATA-MODEL.md` lists none. A session lasts
seven days and is renewed at most once a day while the admin is used.

Signing out deletes the cookie from the browser. A copy of the cookie taken
before that would stay valid until it expires. Two things end every session at
once: changing the admin password (D-062) and changing `AUTH_SECRET`.

### D-061 — two locks on the admin

`proxy.ts` (Next.js 16's name for middleware) runs on `/admin` and `/api/admin`.
With no session it redirects pages to `/admin/login?from=…` and answers API
requests with a 401. The proxy only reads the cookie and never touches the
database, so it is fast and runs before anything renders.

The real check is `requireAdmin()` in `lib/dal.ts`. It loads the admin from
the database and is called in the admin layout, in every admin page, and in
every admin data function. A layout does not re-run on client navigation, so
the layout alone would not be enough. From Phase 6, every route handler under
`/api/admin` calls `adminOrNull()` and answers 401 itself.

`from` is only followed when it is an `/admin` path, so the sign-in page cannot
be used to send someone to another site.

What was tested: a forged session cookie, and the `x-middleware-subrequest`
header behind the 2025 middleware bypass. Both were redirected to sign-in, and
no dashboard markup came back. An unknown path like `/admin/nope` is a 404 once
signed in.

### D-062 — changing the account ends the sessions already open

The session records `authTime`, the moment of sign-in. It does not use `iat`,
because Auth.js rewrites `iat` whenever it renews the cookie. `requireAdmin()`
refuses a session signed in before the admin's `updatedAt`. It redirects to
`/admin/login?expired=1`, which says "Your session has ended. Sign in again."

Signing in writes `lastLoginAt` with timestamps turned off. Otherwise every
sign-in would move `updatedAt` forward and end the other sessions.

Tested: a session cookie opened the dashboard, `--reset-admin-password` ran,
and the same cookie was redirected to `?expired=1`.

### D-063 — the admin on small screens, and where it differs from the design

The admin is drawn at 1440px only. Below 1024px the sidebar becomes a drawer,
opened from a menu button in the top bar. It closes on Escape, on the backdrop,
and when a link is followed.

Where the design and the documents disagree, the documents win:

- Sidebar rows are 44px tall, not the drawn 38px, because
  `docs/02-DESIGN-SYSTEM.md` sets 44px tap targets. The "Sign out" link keeps
  its drawn 11px size and gets an invisible 44px hit area.
- Panels, tiles and the sign-in card use the 14px card radius (D-041). The
  design draws 12px on dashboard panels and 18px on the sign-in card.
- The sign-in card does not take the large shadow drawn under it. The design
  system allows two shadows, the card one and the hero badge one, and the card
  one cannot be seen on the ink background.
- Admin buttons keep the clipped corner, as `docs/04-ADMIN.md` asks, including
  "View site", which the design draws rounded.

Choices where the design shows sample data:

- The page views chart draws one bar per day for 30 days, labelled with dates,
  where the design shows ten bars labelled W1 to W4. Its title says 30 days.
  The three busiest days are blue, as three bars are in the design.
- The avatar in the sidebar shows the admin's initial. The design draws an
  empty circle, and there is no photo to show.
- Month labels are three letters, as drawn. `Intl` in en-GB writes "Sept", so
  the labels come from the date key.

Sidebar counts are read by the layout, so they refresh on a full load, not on
every client navigation. From Phase 6, actions that change a count call
`revalidatePath("/admin", "layout")`.

### D-064 — the client's address is the last X-Forwarded-For entry

A visitor can send their own `X-Forwarded-For`. Nginx's
`$proxy_add_x_forwarded_for` adds the real address after it. Taking the first
entry would let anyone dodge the lockout by inventing a new address on each
try, so the last entry is used. Tested: an invented first entry stayed locked.

Two things for Phase 13:

- Nginx sets `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`.
- The app listens on 127.0.0.1 only, so no one can reach it without Nginx and
  choose the last entry themselves.

Locally there is no proxy, so every attempt shares one key.

### D-065 — widths in the design files leave out padding

The design files have no `box-sizing` reset. A `width` there is the content
only, and its padding is added on top. The sidebar is drawn at 248px with 14px
padding each side, so it renders 276px. The sign-in card is drawn at 420px with
40px each side, so it renders 500px. The tokens hold the rendered widths,
because the site uses `border-box`. The first build used the drawn numbers, and
side-by-side screenshots against the design showed both too narrow.

For the admin screens still to come: any element in `design/` with both a
`width` and a `padding` renders wider than its `width`.

### D-066 — an unknown email takes as long as a wrong password

When the email is not the admin's, the password is still checked against a
dummy scrypt hash of random bytes. Answering quickly would tell a stranger which
email is the admin's. Both answers are also the same, "That email and password
do not match".

The dummy hash is made once for each server process, stored on `globalThis`,
and started by `instrumentation.ts` as the server boots. Next.js loads a
separate copy of the auth module for each route. A copy that made its own hash
on first use answered its first unknown email in 1111ms, against 559ms for a
wrong password. After the change it was 696ms against 572ms, and after that
both were about 550ms.

### D-067 — how sign-in was tested

The tests never used the real `garsame` database, `.env.local`, or the dev
server on :3000. A database named `garsame_authtest_<timestamp>` was seeded with
a test admin, a random password and sample dashboard data. A production build
ran on :3002 against it, with its own `AUTH_SECRET`. Sign-ins went through
Auth.js's HTTP endpoints from a script, and no password was typed into a
browser. Screenshots came from a headless browser given the session cookie.

The results:

- Sign-in, lockout and the dashboard counts: 20 of 20 checks.
- Timing after a restart: 6 of 6.
- Browser, at 1440, 1024, 768 and 390px: 13 of 13. This covered the drawer,
  sign-out, and no sideways scroll.
- Revocation after a password reset: passed.

Afterwards the test database was dropped, the only one removed, and the test
server, its launch entry and its secrets were deleted.

---

## Phase 6

### D-068 — each written block may carry its own heading

`design/05-project-detail.html` gives every block a heading of its own under
the mono eyebrow: "// The problem" over "Care was happening, but nobody could
see it". `docs/05-DATA-MODEL.md` has no field for them, so the project gained
`headings: { problem, constraints, body, outcome }`, each optional. A block
with no heading renders the eyebrow alone. Custom sections already had a
heading in the data model.

### D-069 — a project must be published before it can be featured

`docs/04-ADMIN.md` limits featuring to three, and featured projects are the
home page. A featured draft would hold one of the three places without
appearing anywhere, so the model refuses it, and unpublishing or archiving a
project takes it off. The editor's switch is disabled until the project is
published, and the list says why.

### D-070 — the Phase 6 textareas write the editor's own JSON

`docs/06-BUILD-PROMPTS.md` builds this editor with plain textareas and replaces
them with the block editor in Phase 7, but the stored shape is the editor's
JSON from the start. `lib/editor-text.ts` converts between them both ways:

    blank line   a new paragraph          ## / ###  heading, sub-heading
    - item       a bulleted list          1. item   a numbered list
    > note       the highlighted callout  **bold** *italic* `code` [text](url)

A document written here opens unchanged in the Phase 7 editor, and one written
there reads back into a textarea without losing its shape. The round trip is
checked in `npm run db:check`.

### D-071 — files record which project uses them

`docs/04-ADMIN.md` §9: the Files module "shows which post or project uses a
file before allowing deletion". The project's save hook keeps each file's
`usedBy` current — cover, gallery and custom-section images — so a cover cannot
be deleted from under a published page. Swapping an image out releases the old
one in the same save.

### D-072 — image upload arrives in Phase 6, the rest of Files in Phase 9

A project cannot be published without a cover, so this phase has to accept an
image. `/api/admin/uploads` takes one jpg, png or webp:

- the type is read from the file's first bytes, never from its name or the
  type the browser claims, and the pixel size from the image header, which
  `next/image` needs;
- the file is written under a random name, outside `public/`, and served by
  `app/uploads/[file]/route.ts` with `nosniff` and a year of caching;
- the route checks the admin against the database and refuses a request from
  another origin — a Server Action gets both for free, but actions cap bodies
  at 1MB and an image may be 10MB.

`UPLOAD_DIR` moved from `./public/uploads` to `./uploads`: a file added to
`public/` after a build is not served, and the folder would have collided with
the route. Phase 9 adds the library, webp conversion, thumbnails, svg and pdf.

### D-073 — what the project pages needed, and where the values came from

New tokens, all measured from `design/04-projects.html` and
`design/05-project-detail.html`: a 48px page title (the majority size across
the inner pages — D-041), the 22px client quote, the 1.8 case-study line
height, the 420px cover band, the 280px rail, and the ink-band text colours.

Only "Building" is drawn as a status chip on the ink header. The other three
are mixed from their own status colour and the ink with `color-mix`, rather
than inventing three new hex values.

Below 768px the cover band is 240px rather than 420px, the same reduction the
break band uses (D-037).

### D-074 — with nothing featured, the home page shows the three newest

`docs/03-PAGES.md` asks for "three featured project cards from the database".
Featuring is a deliberate act, and an empty white band between two tinted ones
would break the section rhythm, so with nothing featured the first three
published projects stand in.

### D-075 — the seeded projects, and what is a placeholder

Phase 6 seeds SomaliNotes AI, Heelan Home Health Care and Fursad. Every
sentence comes from the approved screens; only Heelan has a written case study
there, so the other two carry bracketed placeholders — "[ The problem this
project solves — to be written in the admin. ]" — rather than invented copy
(CLAUDE.md rule 10).

The home page's own summaries run to 124 characters, over the 120 the model
allows, so each project takes the longest approved version that fits.

The covers are placeholder SVGs in `public/placeholders/`, drawn from the same
wireframes the cards used in Phase 3 and labelled "[ COVER SCREENSHOT ]". They
hold the token colours as literal hex, because an image file cannot read CSS
variables. The first version put that explanation in an XML comment containing
`--color-accent-soft`; a double hyphen is illegal inside an XML comment, and
every cover silently failed to render. The note is a `<desc>` element now.

### D-076 — the admin list is the order visitors see

The list is drawn in two groups, as `design/27-admin-projects-list.html` shows:
the featured projects, a rule saying how many of the three are used, then the
rest. That is also the public order — `docs/03-PAGES.md` puts featured projects
first — so the list reads top to bottom exactly as the site does, and dragging
reorders within a group.

Dragging uses Framer Motion's `Reorder`, which is in the locked stack, so no
drag-and-drop library was added. It works with a mouse and with a finger; from
the keyboard the handle takes the arrow keys and each move is announced. Below
1024px each row also has up and down buttons.

### D-077 — a new project keeps its URL after the first save

The editor saves through a Server Action and stays where it is. Moving the
address to `/admin/projects/<id>` after the first save — with `router.replace`
or `history.replaceState` — makes Next.js re-render the route, which remounts
the editor: the message listing what is still missing disappears, and anything
typed while the save was in flight is lost. The editor holds the saved id and
keeps updating the same project; the back link leads to the list, where it now
appears.

Publishing follows docs/04-ADMIN.md: blocked with a message naming every gap.
When a draft cannot be published, the writing is still saved as a draft rather
than thrown away — "Saved as a draft. It cannot be published until these are
done:".

### D-078 — the public pages are static, and the admin refreshes them

`/`, `/projects` and every project page are built to static HTML — the
performance targets in CLAUDE.md are about Somali mobile data, and static is
the fastest thing to serve. Every admin action that changes a project
revalidates the pages it affects, so a publish is visible at once. An hour's
`revalidate` is the safety net for changes made outside the admin, such as
`npm run db:seed`; after seeding, `npm run build` (or an hour) brings a running
production server up to date. In development nothing is cached.

### D-079 — how Phase 6 was tested

Against a throwaway database and a production build on :3002, never the real
`garsame` database:

- 26 HTTP checks: the public pages, the order, empty blocks rendering nothing,
  the admin being closed, and the upload route refusing a cross-site request, a
  file that only claims to be a png, and a path walking out of the folder.
- 25 browser checks: reordering by keyboard, the featured switch and its limit,
  publishing an empty project, the draft-with-reasons path, uploading a real
  cover, the page preview, publishing, and no sideways scroll at 1440 or 390.
- `npm run db:check` grew from 37 checks to 42.

The test database was dropped afterwards, and the test server, its launch entry
and its secrets removed.

---

## Phase 7

### D-080 — the editor is TipTap 3, and nothing else was added for it

`docs/04-ADMIN.md` names TipTap, and CLAUDE.md locks the stack, so the only
packages installed are TipTap's own: `@tiptap/react`, `@tiptap/pm`,
`@tiptap/starter-kit`, `@tiptap/extensions`, `@tiptap/extension-image`,
`@tiptap/extension-code-block-lowlight` and `lowlight` for the code block's
highlighting. No drag-and-drop library, no pop-up library, no component
library: the insert pane, the selection toolbar and the slash menu are written
here against the design.

The starter kit's strike and underline are switched off. They are not in the
block list, and a mark the editor can write but the renderer does not draw
would be lost on save.

### D-081 — highlighting is for writing, not for reading

The code block highlights while it is being written, in the editor, using
`lowlight`. Public pages render code in one colour, as
`design/07-blog-post.html` draws it: the ink card, the language on the left, a
copy button on the right.

Highlighting a page for the reader would mean shipping a syntax highlighter to
every visitor, and inventing a palette the design system does not have. Neither
is worth it against the performance targets in CLAUDE.md, which are about
Somali mobile data. The editor's own highlight colours are mixed from existing
tokens — accent on dark for keywords, the warning tint for strings — so no new
colour entered the system.

### D-082 — autosave waits for the first save

`docs/04-ADMIN.md` asks for "autosave every few seconds with a saved
indicator". A project that has been saved once autosaves two and a half seconds
after the last keystroke, and the top bar says "Saving…", then "Saved 8s ago".

A project that has never been saved does not autosave. Opening "New project"
and walking away would otherwise leave an empty draft in the list every time.
The first save is deliberate — the Save or Publish button — and everything
after it is automatic.

### D-083 — what an editor document may hold, checked twice

The editor can only produce the blocks `docs/04-ADMIN.md` lists, and
`lib/editor-schema.ts` keeps only those on the way into the database: unknown
node types, unknown marks, unknown attributes and any link that is not http,
https or mailto are dropped, and a document over 200KB is refused.

Two attributes are checked rather than trusted: an image must name a file that
was uploaded through `/api/admin/uploads` (its id, its address and its real
pixel size), and an embed must be a valid address. A YouTube address of any
shape becomes a player; anything else becomes a link card.

Output is React elements, never an HTML string, so every piece of text is
escaped by React on the way to the page.

### D-084 — images inside the writing count as used files

`File.usedBy` already tracked covers, gallery images and custom-section
images. The block editor can put an image anywhere in a document, so the
project's save hook now also walks the body, the constraints, the outcome and
every custom section for image ids. A picture inside a published case study
cannot be deleted from the Files module either.

### D-085 — the Phase 6 text syntax stays, for the seed

`lib/editor-text.ts` — the small syntax the Phase 6 textareas used (D-070) —
is no longer part of the editor, but `scripts/seed-projects.ts` still writes
the three seeded case studies with it, and `npm run db:check` still proves the
round trip. It is a convenient way to write a document in a script, and
deleting it would mean spelling out the seed's JSON by hand.

---

## Gap Pages & Header Fix

### D-086 — button labels never wrap, and header CTA does not shrink

Between 1280px and ~1350px the header had just enough space to show all 8 nav links,
but squeezed the "Start a Project" button, wrapping its text into two lines and
overflowing the 76px header height.

`Button` layout was updated with `whitespace-nowrap`, and the header CTA wrapper
was given `shrink-0` to guarantee the button never breaks onto two lines or gets
crushed at narrow desktop widths.

### D-087 — /about, /services and /privacy built from approved specifications

`/about`, `/services`, and `/privacy` were originally left as Phase 2 stubs
because `docs/06-BUILD-PROMPTS.md` lacked explicit phase assignments for them.

All three pages are now fully implemented against `design/02-about.html`,
`design/03-services.html`, and `docs/03-PAGES.md`:
- `/about`: hero, v1, v2, v3, Education & Research, Principles, and CTA banner.
- `/services`: hero, six detailed service cards with "WHAT CHANGES" panels, process strip, and CTA banner.
- `/privacy`: plain-English data notice covering collection, purposes, zero tracking, retention, and deletion rights.
- Numbered spine omitted on all pages per D-044.

---

## Phase 8

### D-088 — post templates on creation

When creating a new post, `TemplateModal` offers four starting structures:
1. **Case note** (problem, constraints/what was cut, system delivered, outcome)
2. **Technical explainer** (premise, how it works, edge cases/local network conditions, practical advice)
3. **Short opinion** (direct thesis, callout counter-argument, supporting observations, conclusion)
4. **Blank** (empty canvas)

Each template seeds the editor with initial nodes without restricting subsequent editing.

### D-089 — reading experience and table of contents

`design/07-blog-post.html` specifies a focused 680px reading measure.
- **Table of contents**: generated automatically on save from headings and sub-headings (levels 2 and 3). Desktop displays a sticky left rail that highlights the currently visible section via an `IntersectionObserver`.
- **Reading progress bar**: 4px blue indicator fixed to the top of the viewport tracking scroll depth.
- **Syntax and code**: rendered with copy buttons on code blocks.
- **Related posts**: displays up to two published articles in the same category at the bottom of the page.

### D-090 — admin blog editor, previews and scheduled publishing

- **Card preview**: rendered beside the excerpt field in the right rail, updating in real-time as the title, category, excerpt and reading time change.
- **Page preview**: renders the full public article view in a modal overlay, including unsaved changes and formatting.
- **Scheduled publishing**: a draft with `scheduledFor` set is validated against all publish rules at the moment of saving, ensuring it will go out cleanly when the cron/queue fires.
- **File usage tracking**: `StoredFile.usedBy` tracks both the cover image and any inline images embedded in the post body, preventing accidental file deletion while used by a post.

---

## Phase 9

### D-091 — File uploads accept JPG, PNG, WebP, SVG, and PDF with security sanitization

The upload pipeline (`lib/uploads.ts`, `app/api/admin/uploads/route.ts`, and `app/uploads/[file]/route.ts`) now accepts JPG, PNG, WebP, SVG, and PDF up to 10MB (`MAX_FILE_BYTES`).
- All uploads are inspected by magic bytes (never trusted from the client's `Content-Type` header).
- SVGs are scanned to reject embedded `<script>` tags, javascript URI schemes, and inline event handlers (`onload=`, etc.) to prevent stored XSS attacks.
- Uploaded files are assigned random UUID filenames and served outside `public/` with `X-Content-Type-Options: nosniff`.

### D-092 — Protected file deletion and media library manager

The Files admin module (`/admin/files`) displays all stored assets with type filters (`All`, `Images`, `Documents`, `Unused`), live search, drag-and-drop batch upload, and storage stats.
- **Protected deletion**: A file with non-empty `usedBy` references cannot be deleted. The inspector modal clearly identifies which projects, posts, or settings reference the file with direct links to edit them.
- **In-place replacement**: Replacing a file uploads new content and dimensions while retaining the existing MongoDB document `_id`, preserving all existing links and relationships across the site.
- **Media picker**: A shared `MediaPickerModal` component allows picking uploaded assets or uploading new ones directly within editors across the admin.

### D-093 — Zero color controls in Admin Branding & Look and Settings (CLAUDE.md Rule 2)

Branding & Look (`/admin/branding`) and Settings (`/admin/settings`) control content only (logos, hero copy, rotating words, portrait image, badges, break image, social links, CV download, bios, contact details, FAQ, and clients).
- Colors are strictly locked in code (`styles/tokens.css` and Tailwind theme).
- Hero badge tone selector maps to defined design token families (`warning`, `success`, `accent`) and icons (`bolt`, `check`, `clock`) per D-050.

### D-094 — Dynamic settings and public site wiring

Site components across `/`, `/about`, and `/services` read directly from the database `Settings` collection via `getSiteSettings()`. If the document is unconfigured or fields are empty, components safely fall back to the approved copy from `lib/content/home.ts`, ensuring the site never breaks or displays blank spaces.

---

## Phase 10

### D-101 — Multi-layer anti-spam on all public forms

Public form submissions (`/contact`, `/membership`, `/testimonials`, home page and blog rail) enforce a four-layer anti-bot defense:
1. **In-memory sliding window IP rate limiting** (`lib/rate-limit.ts`): 5 submissions per 15 min per IP for contact and membership; 3 submissions per 15 min for testimonials.
2. **Hidden honeypot field** (`website_hp` / `company_hp`): silently dropped/neutralized if filled by bots.
3. **Signed time-to-submit token** (`lib/anti-spam.ts`): submissions completed in under 1.5s or with tampered HMAC signatures are rejected.
4. **Server-side validation**: schema fields, email formats, and string length caps.

### D-102 — Strict MailLog recording on every send (Rule 5)

All transactional emails (`welcome`, `contact-notify`, `testimonial-notify`, `test`) go through `sendLoggedMail()` in `lib/email/logger.ts`.
- Every dispatch writes a `MailLog` record as `queued` before calling Nodemailer.
- On success, it is updated to `sent` with `sentAt` timestamp and `attempts: 1`.
- On error, it is updated to `failed` with the SMTP provider's error trace.
- No email is ever sent silently.

### D-103 — 1-click token-based unsubscribe without deletion

Members have unique 32-byte cryptographic tokens (`unsubToken`).
- Unsubscribing via `/unsubscribe?token=...` flips member status to `unsubscribed` and sets `unsubscribedAt`.
- The member record is strictly retained (never deleted) to preserve audit trails, broadcast history, and prevent re-adding unsubscribed recipients.
- A 1-click "Re-subscribe" action is provided on the confirmation screen for accidental clicks.

### D-104 — Admin Messages (Inbox) and Members modules

- **Messages (`/admin/messages`)**: 2-pane manager with status filter tabs (`Unread`, `All`, `Archived`), read/archive toggles, deletion, suggested service & similar project cards, and direct SMTP/mailto reply workflows.
- **Members (`/admin/members`)**: Member directory with status filters (`All`, `Active`, `Unsubscribed`), real-time search, status toggle, delete with confirmation, and RFC 4180 CSV export endpoint (`/api/admin/members/export`).

---

## Phase 11

### D-111 — Testimonials moderation, project linking, and live social proof

The Testimonials module (`/admin/testimonials`, `lib/admin/testimonials.ts`) manages client quotes and social proof:
- **Moderation Workflow**: Every submitted testimonial begins in `pending` state and never appears publicly until approved by Garsame (CLAUDE.md Rule 6). Submitter email and IP address remain strictly private (`select: false`, D-049).
- **Admin Actions**: Publish, publish & feature on home page, edit typos without altering meaning, link to specific projects (so quotes appear on that case study page), reject, delete, and manual direct testimonial creation.
- **Drag-to-Reorder**: Published testimonials are re-orderable by drag-and-drop, updating their `position` index live in the database.
- **Dynamic Site Social Proof**: Home page (`/`) reads live from `getFeaturedTestimonials()`, gracefully falling back to approved copy when fewer than two testimonials exist.

### D-112 — TipTap to email HTML renderer

Broadcasts are composed using the TipTap block editor (`components/admin/updates/UpdateEditor.tsx`) and serialized to email-client-compatible HTML (`lib/email/broadcast.ts`):
- All typography, callouts, quotes, images, lists, and code blocks are styled with inline CSS targeting Apple Mail, Gmail, Outlook, and mobile mail clients.
- Preview snippets are injected via zero-height hidden preheaders to ensure email inbox previews show the custom preview text rather than header boilerplate.
- Every broadcast email is personalized with the recipient's first name and contains a unique cryptographic one-click unsubscribe URL.

### D-113 — Safety confirmation & throttled batch email delivery (Rule 5)

Broadcast dispatches require an explicit two-step safety confirmation modal naming the exact count of active recipients and estimated delivery time:
- Sending is throttled with sequential delays to prevent SMTP connection throttling and rate-limit drops.
- Every single member send generates an audit record in `maillogs` (`type: "broadcast"`, `status: "queued"`) before transmission and updates to `sent` or `failed` with provider response traces. No silent sends (CLAUDE.md Rule 5).

### D-114 — Per-recipient Mail Log and retry system

The Mail Log view (`/admin/updates/[id]/logs`, `design/24-admin-mail-log.html`):
- Displays real-time aggregate delivery stats (Recipients, Delivered, Failed, Status) and status filter tabs (`All`, `Sent`, `Failed`, `Queued`).
- Lists every recipient with status badge, delivery timestamp, and full SMTP error message for diagnostics.
- Provides 1-click single retry for individual failed recipients and bulk "Retry X failed" for entire failed batches, updating delivery counters on the parent `Broadcast` document.
- Provides RFC 4180 CSV export (`/api/admin/updates/[id]/logs/export`) for offline auditing.

---

## Phase 12

### D-121 — First-party analytics engine, privacy model and daily aggregation

- **100% First-party**: No third-party tracking scripts (Google Analytics, Mixpanel, etc.) or marketing pixels are used. No cookie consent banners are required.
- **Privacy & Sanitization**: Raw referrers have query parameters stripped immediately on receipt, discarding user IDs, search queries, or campaign tokens before database storage. Raw user-agents are never saved; only high-level device categories (`Phone`, `Computer`, `Tablet`) are derived in memory.
- **Mogadishu Time Zone**: Daily buckets (`StatsDaily`) and chart calculations use `Africa/Mogadishu` (UTC+3, no DST), guaranteeing consistency between site midnight and local operations.
- **Aggregation**: Raw `PageView` entries are aggregated into `StatsDaily` rows for both individual page paths and the site-wide `path: "*"` aggregate, recording views, unique sessions, top referrers, and device distribution.

### D-122 — Dynamic Open Graph images with Next.js ImageResponse

- `/api/og` generates dynamic 1200x630 Open Graph images with `@vercel/og` (`next/og`).
- Styled with deep navy background (`#0E1533`), radiant brand blue accents (`#3D5AF1`), GARSAME v3 wordmark badge, dynamic type chips (CASE STUDY, ARTICLE, PORTFOLIO), bold typography, and subtitle copy.
- Automatically used as high-resolution social sharing cards across all project case studies and blog posts when dedicated cover images are not provided.

### D-123 — JSON-LD structured data architecture

- Structured metadata components in `components/site/JsonLd.tsx`:
  - `PersonJsonLd`: Injected on `/` and `/about` with Garsame Mohamud's professional details, location, social links, and core competencies.
  - `ArticleJsonLd`: Injected on `/blog/[slug]` with article headline, dates, author, publisher, and keywords.
  - `ProjectJsonLd`: Injected on `/projects/[slug]` with creative work title, summary, problem statement, creator, and technology stack.

### D-124 — Completion of all 11 Admin modules and polish

- With the implementation of Stats (`/admin/stats`), all 11 modules specified in `docs/04-ADMIN.md` (Dashboard, Members, Updates, Blog, Projects, Testimonials, Messages, Stats, Files, Branding & Look, Settings) are complete and operational.
- The `app/admin/(panel)/[module]` placeholder route has been retired and removed.
- XML Sitemap (`/sitemap.xml`) and Robots (`/robots.txt`) dynamically expose all public routes while protecting admin, API, and staging routes.

---

## Phase 13

### D-131 — Single-node VPS production architecture

The application is deployed on an Ubuntu 22.04/24.04 LTS VPS running:
- **Node.js 20 LTS** managed by **PM2** in cluster mode with automatic restart on memory exhaustion (`max_memory_restart: 600M`) and automatic boot startup.
- **Nginx** reverse proxy terminating TLS 1.2/1.3 with Let's Encrypt certificates, proxying requests to local port 3000, enforcing security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `HSTS`), and serving immutable static assets (`/_next/static/`) with 1-year cache headers.
- **MongoDB 7.0+** running locally with authentication enabled.

### D-132 — Production health check endpoint (`/api/health`)

A dedicated health check endpoint at `/api/health` validates active database connectivity (`mongoose.connection.readyState === 1`) and returns system uptime, timestamp, and environment metadata:
- Returns HTTP 200 with `{ status: "healthy" }` when operational.
- Returns HTTP 503 with `{ status: "unhealthy" }` if database connectivity drops, enabling automated uptime monitors and failover mechanisms.

### D-133 — Automated database backup & retention pipeline

The backup script (`deploy/scripts/backup-db.sh`):
- Generates timestamped MongoDB archive dumps with Gzip compression (`mongodump --gzip --archive`).
- Stores dumps in `/var/backups/mongodb/garsame/`.
- Rotates backups on a 14-day rolling retention policy to conserve disk space.
- Scheduled nightly at 03:00 AM Mogadishu time via system cron.

### D-134 — Zero-downtime deployment script (`deploy/scripts/update.sh`)

Production updates execute sequentially:
1. `git pull origin main` to pull clean commits.
2. `npm ci` for strict deterministic dependencies.
3. `npm run build` to compile the Next.js production bundle.
4. `npm run db:seed` to ensure collections and unique indexes are synchronized.
5. `pm2 reload ecosystem.config.cjs --env production` for rolling worker process restarts with zero dropped requests.
6. Post-deployment verification querying `/api/health`.

---

## Post-launch polish

### D-135 — the outgoing page fade, resolved

D-024's blocker was structural: `app/(site)/template.tsx` remounts on every
navigation, so by the time it could animate an exit, the outgoing tree was
already gone — there was nothing left to hold onto.

The fix moves the transition out of the template and into a client component,
`components/site/PageTransition.tsx`, mounted once in `app/(site)/layout.tsx`
(which does not remount on navigation). It reads `usePathname()` and keys a
`motion.div` on it, wrapped in Framer Motion's `AnimatePresence`. Because the
component's own identity persists across navigations, `AnimatePresence` can
keep rendering the previous page's tree for the length of its exit animation
even though the App Router has already moved on to the next route.

`mode="popLayout"` is what avoids the delay D-024 worried about: the instant a
page starts exiting, it is pulled out of layout flow (`position: absolute`),
so the incoming page renders immediately in its place rather than waiting
250ms for the exit to finish. `<main>` gained `relative` so that absolute
positioning resolves against it rather than the nearest positioned ancestor
further up the tree.

The `hydrated` flag that skips the enter animation on first load (D-032) is
now `useSyncExternalStore` with no-op subscribe, `() => true` client snapshot
and `() => false` server snapshot — the standard hook for "false on the
server and the hydrating render, true after" — rather than the module-level
`let` template.tsx used. Two more direct attempts were rejected by ESLint
first: a `useRef` read during render (`react-hooks/refs` — a ref read outside
an effect or handler), then `useState` flipped inside a bare `useEffect`
(`react-hooks/set-state-in-effect` — the same cascading-render risk D-023 was
written to avoid). `useSyncExternalStore` re-renders once hydration finishes
without either problem, because the snapshot check is built into the hook
rather than a manual `setState` call.

`app/(site)/template.tsx` is deleted; `PageTransition` replaces it entirely.

### D-136 — D-013 needed no further decision

Re-checked while revisiting D-024: the "still open" note under D-013 was about
the on-ink `completed` chip specifically, and that was already closed in
Phase 6 by D-073 — `--color-accent-on-ink` and `--color-accent-on-ink-bg` are
both `color-mix()` results from `--color-blue`, the same family
`--color-accent-ink` and `--color-accent-soft` (the light-mode `completed`
chip) are themselves built from. Light and on-ink versions of the chip are the
same hue at different mixes, not two different judgment calls. No code change
was needed.

### D-137 — the rotating hero words stay as they are; this is a copy decision, not a code one

D-033 already made the layout side of this correct: no word can cause a
layout shift, whatever its width, and the mechanism is not a bug. What is
unresolved is that three of the four approved rotating words
(`runs on`, `grows with`, `depends on` — `heroRotatingWords` in Settings,
seeded from `lib/content/home.ts`) are wider than the 572px column at 52px
allows on one line with `your business`, so the headline sits on three lines
whenever one of those two is showing, rather than the two the design draws.

Making the box reflow to each word's real width would fix the three-line
layout but reintroduce the jump D-033 rejected; there is no code change that
gets both. The only way back to the design's two-line headline is different
words — no wider than "runs on" — and CLAUDE.md rule 10 means that is not
something to invent here. Carried into the CV/content pass as a real question
for Garsame: keep the current words (three-line headline, no code change), or
supply replacements for "grows with" and "depends on" that fit.







