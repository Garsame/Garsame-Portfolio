# CLAUDE.md — Garsame v3 Portfolio

Standing rules for this repository. Read this before any task.

## What this is

A personal portfolio and client-acquisition site for Garsame Mohamud, a software
engineer in Mogadishu, Somalia. It has a public site and a full admin area that
Garsame operates himself. He is the only admin.

Brand name: **GARSAME v3**. Tagline: **Complex problems, simple software.**

## Stack — locked, do not substitute

- Next.js (App Router) + TypeScript — one codebase for site, admin and API
- Tailwind CSS
- MongoDB with Mongoose
- NextAuth (credentials provider) for admin login
- Nodemailer over SMTP for all email
- Framer Motion for page transitions and scroll reveals
- Deployed on a VPS behind Nginx, Ubuntu, PM2

Do not introduce a component library (no MUI, Chakra, shadcn). Components are
written by hand against the design system in `docs/02-DESIGN-SYSTEM.md`.

## Non-negotiable rules

1. **Colours, typography, spacing and motion come only from the design tokens.**
   Never hardcode a hex value in a component. If a value is missing from the
   token file, add it there first.
2. **No colour editing from the admin.** Branding and Look edits content only —
   logo, hero text, images, social links, bio, CV. Colours live in code.
3. **Server-render every public page.** No client-side-only data fetching for
   content a search engine should see.
4. **Text sizing is by named level** — Display, H1, H2, H3, Body, Small. Never
   arbitrary font sizes in the editor or in components.
5. **Every email send is logged** to the `maillogs` collection with recipient,
   subject, status, timestamp and error. No silent sends.
6. **Nothing user-submitted appears publicly without admin approval** — this
   applies to testimonials above all.
7. **Validate on the server.** Client validation is convenience, never trust.
8. **Images are optimised** through `next/image` with explicit width and height.
9. **Respect `prefers-reduced-motion`** — all reveals become instant.
10. **Never invent content.** If a real value is missing (a phone number, a
    testimonial, a client name), use a clearly bracketed placeholder such as
    `[YOUR NUMBER]`. Do not fabricate clients, numbers, quotes or logos.

## Audience and voice

Visitors are business owners in Somalia and East Africa, plus recruiters.

- Public copy speaks about **what the client gains**, never about the stack.
  Write "one place for the whole business", not "a React dashboard".
- Framework and language names appear **only** on project detail pages, in the
  Stack section.
- Plain English. Short sentences. No marketing inflation, no invented statistics.

## Performance targets

- Lighthouse performance ≥ 90 on mobile
- Largest Contentful Paint under 2.5s on a 3G connection — visitors are on
  Somali mobile data, this is a hard requirement not an aspiration
- No layout shift on font load; use `next/font`

## The approved design

`design/` holds all 30 approved screens as real HTML — the public pages, the
fifteen admin screens, and the parked logo options. They are reference material,
never imported and never shipped.

When a value is not written in `docs/02-DESIGN-SYSTEM.md`, read it out of the
matching file in `design/` and use it exactly: the real hex, the real pixel
value, the real letter-spacing. Do not round to a 4/8px grid and do not
substitute a Tailwind default.

Before building any page or admin screen, open its file in `design/` first.

## Repository layout

```
/app
  /(site)        public pages
  /admin         admin area, auth-guarded
  /api           route handlers
/components
  /ui            buttons, inputs, cards, badges
  /site          section components
  /admin         admin components
/lib             db, auth, mail, validation, utils
/models          Mongoose schemas
/styles          globals.css, tokens
/docs            the specification documents
/public
```

## Order of work

Follow `docs/06-BUILD-PROMPTS.md` phase by phase. Do not skip ahead. Each phase
ends with something that runs.

## When something is unclear

Check the docs in this order: `03-PAGES.md`, `02-DESIGN-SYSTEM.md`,
`04-ADMIN.md`, `05-DATA-MODEL.md`. If the answer is genuinely not there, make
the simplest choice consistent with these rules, and note it in a `DECISIONS.md`
entry rather than stopping.
