# 06 — Build Prompts for Claude Code

Paste these one at a time, in order. Do not skip ahead — each phase ends with
something that runs, so a mistake is caught before it is built on.

**Before phase 0:** create the repo folder, put `CLAUDE.md` at its root and this
`docs/` folder beside it, then open Claude Code there.

---

## Phase 0 — Scaffold

```
Read CLAUDE.md and every file in docs/ before writing any code.

Set up the project:
- Next.js with the App Router and TypeScript
- Tailwind CSS
- ESLint and Prettier
- Mongoose, connecting to MongoDB with a cached connection helper
- next/font loading Plus Jakarta Sans and IBM Plex Mono
- The folder structure described in CLAUDE.md
- .env.example with every variable the project will need
- A README with local setup steps

Put every colour, type level, spacing value, radius and motion token from
docs/02-DESIGN-SYSTEM.md into the Tailwind theme and into a CSS custom property
block. No component may use a raw hex value afterwards.

Finish with a placeholder home page that renders the wordmark and tagline using
only tokens. Confirm `npm run dev` works.
```

## Phase 1 — The UI kit

```
Build the shared components in /components/ui against docs/02-DESIGN-SYSTEM.md:

- Button: primary, secondary, ghost; sizes sm and md; the clipped top-right
  corner per the spec, including the two-layer wrapper for the outlined variant
- SectionHeading: mono eyebrow prefixed with //, heading with the last phrase in
  accent, optional sub-paragraph, left or centre aligned
- Card: plain rounded 14px, 1px border, the single soft shadow, hover state
- Badge and StatusChip: live, building, completed, concept
- IconTile: 46px rounded 12px, accent-soft background
- Input, Textarea, Select, Checkbox, FormField with label and error
- Container: max width and gutters

Then a components showcase page at /dev/ui rendering every component in every
state. I will review that page before you continue.
```

## Phase 2 — Public shell

```
Build the site shell:
- Header, sticky, with the nav from docs/03-PAGES.md and the Start a Project
  button; active link styling; mobile sheet at 250ms fade and 8px rise
- Footer
- The page transition and section reveal from the motion spec, using Framer
  Motion, honouring prefers-reduced-motion
- A reusable Section wrapper that applies the background rhythm

Create every route from docs/03-PAGES.md as a stub page with correct metadata,
so the whole site navigates before any section is built.
```

## Phase 3 — The home page

```
Build all thirteen home page sections from docs/03-PAGES.md, using the
components from Phase 1. Content is hardcoded in this phase; it moves to the
database in Phase 6.

Take care with:
- The hero: three stacked circles, portrait breaking out above them, three
  floating badges positioned as described
- The rotating last phrase in the headline, 2.5s hold, 200ms out, 300ms in
- The alternating section backgrounds, exactly as listed
- The FAQ accordion, keyboard operable

Then check it at 1440, 1024, 768 and 390 pixels wide and fix what breaks. Show
me a screenshot at each width.
```

## Phase 4 — Database and models

```
Create every Mongoose model in docs/05-DATA-MODEL.md, with validation,
indexes and the publish rules enforced at the model or service layer.

Add:
- A seed script that creates the admin user from environment variables and the
  settings document with the real values from docs/03-PAGES.md
- Slug generation with collision handling
- A reading-time and table-of-contents helper that runs on save
```

## Phase 5 — Auth and the admin shell

```
Add NextAuth with a credentials provider against the users collection.
Protect every /admin and /api/admin route with middleware, not only in the UI.

Build the admin shell: sidebar with the eleven modules, top bar, content area,
using the same design system as the public site. Build the login page and the
Dashboard with its tiles, charts and attention list, reading real counts.
```

## Phase 6 — Projects, end to end

```
Build the Projects module from docs/04-ADMIN.md and the model in
docs/05-DATA-MODEL.md:
- List with drag-to-reorder and the featured switch limited to three
- The editor form with required fields, optional blocks and custom sections
- Server-side publish validation with clear messages
- Page preview and card preview
- The public /projects and /projects/[slug] pages reading from the database
- Wire the home page Projects section to the three featured projects

Seed three real projects from docs/01-PROJECT-BRIEF.md so the pages have
content: SomaliNotes AI, Heelan Home Health Care, Fursad.
```

## Phase 7 — The block editor

```
Build the TipTap editor described in docs/04-ADMIN.md as a shared component:
the + button, the / command menu, the selection toolbar, every block type,
image upload with alt text and width, autosave, word count, distraction-free
mode.

Text sizing is by named level only — do not add a font-size control.

Build the matching renderer that turns the stored JSON into the public page
markup, styled to the article rules in docs/02-DESIGN-SYSTEM.md. Sanitise on
output.

Replace the plain textarea in the Projects editor with this component.
```

## Phase 8 — Blog

```
Build the Blog module and the public /blog and /blog/[slug] pages:
- Post templates on creation
- Scheduling, draft, published, archived
- Page preview and card preview
- The reading experience: 680px measure, table of contents, reading progress
  line, code copy buttons, author card, membership invitation, related posts
- Wire the home page Blog section to the three latest published posts
```

## Phase 9 — Files, Branding & Look, Settings

```
Build the Files module with upload, thumbnails, webp conversion, usage tracking
and protected deletion.

Build Branding & Look and Settings exactly as specified — every text, image and
link on the public site editable, and no colour controls anywhere.

Replace the remaining hardcoded home page content with settings values.
```

## Phase 10 — Forms, email and members

```
Build:
- The contact form, the membership join form and the testimonial submission
  form, each rate-limited, with a honeypot and a time-to-submit check, validated
  on the server
- The Messages and Members admin modules
- Nodemailer over SMTP with a send test button in Settings
- The maillogs collection written on every single send
- Welcome email to new members, notification emails to Garsame on new messages
  and new testimonials
- Unsubscribe by token
```

## Phase 11 — Testimonials and Updates

```
Build the Testimonials module: the submission inbox, publish, edit, feature,
reject, reorder, and optional linking to a project. Nothing appears publicly
until published. Wire the home page section and /testimonials.

Build the Updates module: compose with the editor, send a test to myself, the
recipient count and confirmation step, send or schedule, queued and throttled
sending, and the per-recipient mail log with retry.
```

## Phase 12 — Stats, SEO and polish

```
Add first-party page view counting and the Stats module with nightly
aggregation. No third-party analytics script.

Then:
- Metadata, Open Graph and Twitter tags on every page; dynamic OG images for
  projects and posts
- sitemap.xml and robots.txt
- JSON-LD: Person on /about, Article on posts, CreativeWork on projects
- The 404 page and the privacy page
- Run Lighthouse on mobile and fix anything below 90
- Check every page at 390, 768, 1024 and 1440 pixels
- Test with prefers-reduced-motion enabled
- Full keyboard pass over the nav, the FAQ, every form and the editor
```

## Phase 13 — Deployment

```
Prepare for the VPS:
- Production build configuration
- PM2 ecosystem file
- Nginx config with gzip, caching headers and a certbot-ready TLS block
- MongoDB connection and a daily backup script
- A deployment runbook in DEPLOY.md covering first deploy and updates
- A health check endpoint
```

---

## How to work with Claude Code through this

- One phase per session where you can. Long sessions lose the thread.
- At the end of each phase, run it and look at it before starting the next.
- If Claude Code proposes a library that is not in CLAUDE.md, say no.
- If it asks a question already answered in `docs/`, point it at the file rather
  than answering from memory — that keeps the documents the single source of truth.
- When you change your mind about something, change the document first, then
  tell Claude Code to re-read it. Never leave the code and the spec disagreeing.
