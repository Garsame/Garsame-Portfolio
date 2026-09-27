# GARSAME v3

Portfolio and client-acquisition site for Garsame Mohamud, software engineer,
Mogadishu. Public site plus a full admin area that Garsame operates himself.

**Complex problems, simple software.**

---

## Local setup

Requires **Node 20.9+** (built on 22.14) and a **MongoDB** you can reach —
either a local `mongod` or an Atlas cluster.

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

Open http://localhost:3000.

Only `MONGODB_URI` matters to get the site running. The rest of `.env.example`
is filled in as the phases that need it arrive — every variable the project
will ever need is listed there from the start, so nothing is discovered late.

## The database

Collections, rules and indexes live in `/models`, one file per collection in
`docs/05-DATA-MODEL.md`.

```bash
npm run db:seed    # create indexes, the site settings and the admin account
npm run db:check   # prove every data rule against a throwaway database
```

**Seeding.** Set `ADMIN_PASSWORD` (12+ characters) in `.env.local`, then run
`npm run db:seed`. It builds every index, creates the settings document from
the approved copy, and creates the one admin account. It is safe to run again:
it never overwrites an existing admin or settings that have been edited. To
change the admin password, set a new `ADMIN_PASSWORD` and run
`npm run db:seed -- --reset-admin-password`.

**Checking.** `npm run db:check` runs 37 checks — publish rules, featured
limits, slug collisions, reading time, protected fields, file deletion and more
— in a database created for the run and dropped afterwards. It never touches
the database named in `MONGODB_URI`. Run it after changing a model.

**Rules live in the models, not the forms.** Publishing, the featured limits
and the computed fields run in each model's save hook. Those fields —
`state`, `featured`, `body` and a few others — cannot be changed with
`updateOne` or `findOneAndUpdate`; load the document and `save()` it, or the
update is refused. See `DECISIONS.md` D-045 onward.

## Projects

The Projects module is the first one built (Phase 6): `/admin/projects` lists
them in the order visitors see, with drag-to-reorder and the featured switch;
`/admin/projects/[id]` is the editor.

- **Covers and gallery images** upload to `UPLOAD_DIR` (`./uploads`, outside
  `public/`) and are served at `/uploads/…`. Only jpg, png and webp, checked by
  their real bytes, up to 10MB. The rest of the Files module lands in Phase 9.
- **Written blocks** use the block editor (Phase 7, TipTap). Three ways to
  insert: the `+` button on an empty line, typing `/` anywhere, or markdown
  shortcuts (`## ` for a heading, `- ` for a list). Blocks: heading,
  sub-heading, lists, quote, callout, code block, image, divider and embed.
  Text size is by named level — there is no font-size control, deliberately.
  Once a project has been saved once, it autosaves a few seconds after you
  stop typing. D-080 to D-083.
- **Publishing** is blocked with a message naming every missing field; the
  writing is still saved as a draft. A project must be published before it can
  be featured, and at most three are featured at once.
- **The public pages are static.** The admin refreshes them on every change, so
  a publish shows at once. Changes made outside the admin — `npm run db:seed` —
  need `npm run build` (or an hour) to show on a production server. D-078.

## The admin

Sign in at http://localhost:3000/admin/login with `ADMIN_EMAIL` and the
password you seeded. `AUTH_SECRET` must be set in `.env.local`; generate one
with `openssl rand -base64 32`.

- **Two locks.** `proxy.ts` turns away any request to `/admin` or `/api/admin`
  without a session. Then `requireAdmin()` in `lib/dal.ts` checks the session
  against the database in the layout, every admin page and every admin data
  function. Every route handler under `/api/admin` must call `adminOrNull()`
  and answer 401 itself; the proxy alone is not enough. D-061.
- **Lockout.** Five failed sign-ins from one address lock sign-in from that
  address for fifteen minutes. D-059.
- **Sessions** last seven days. Changing the admin password ends every session
  already open. Changing `AUTH_SECRET` does too. D-060, D-062.
- **In production** Nginx must set `X-Forwarded-For`, and the app must only be
  reachable through Nginx, or the lockout can be dodged. D-064.

## Scripts

| Script                 | Does                                          |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Dev server on :3000                           |
| `npm run build`        | Production build                              |
| `npm start`            | Serve the production build                    |
| `npm run lint`         | ESLint                                        |
| `npm run lint:fix`     | ESLint, fixing what it can                    |
| `npm run typecheck`    | `tsc --noEmit`                                |
| `npm run format`       | Prettier over the source (never over `docs/`) |
| `npm run format:check` | Prettier in check mode, for CI                |

## Stack

Locked in `CLAUDE.md`. Do not substitute.

- **Next.js 16** (App Router) + **TypeScript** — one codebase for site, admin and API
- **Tailwind CSS 4** — theme defined in CSS, no `tailwind.config.ts`
- **MongoDB** + **Mongoose 9**
- **NextAuth** (credentials) for admin login — Phase 5
- **Nodemailer** over SMTP for all email — Phase 10
- **Framer Motion** for page transitions and scroll reveals — Phase 2
- **TipTap** for the block editor — Phase 7

Deployed to a VPS behind Nginx on Ubuntu with PM2.

There is **no component library** — no MUI, Chakra or shadcn. Every component
is written by hand against the design system.

## Layout

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
/styles          globals.css, tokens.css
/docs            the specification — the source of truth
/design          the 30 approved screens, reference only
/public
```

## The design system

`styles/tokens.css` is the single source of truth for every colour, type level,
space, radius, shadow and motion value.

**No component may contain a raw hex, a raw font size or a raw pixel value.**
If a value is missing from the token file, it gets added there first. This is
rule 1 in `CLAUDE.md` and it is not negotiable.

Tailwind's own palette, type scale, fonts, breakpoints and shadows are cleared
in `@theme`, so `bg-blue-500`, `text-xl` and `shadow-lg` do not exist. Writing
one fails to generate rather than quietly entering the design.

Text sizing is **by named level only** — `text-display`, `text-h1`, `text-h2`,
`text-h3`, `text-body-lg`, `text-body`, `text-small`, `text-caption`,
`text-mono-label`, `text-mono-meta`, `text-mono-chip`. Each carries its own line
height, tracking and weight, so a level is the whole level and never just a
size. Headings of `text-display`, `text-h1` and `text-h2` have `-sm` mobile
counterparts, composed as `text-h1-sm lg:text-h1`.

**A colour may never share a name with a type level.** Tailwind builds `text-*`
utilities from both namespaces, so a colour called `body` and a level called
`body` collide and the colour wins silently — which is why the body text colour
is `text-ink-body` and not `text-body`. See `DECISIONS.md` D-014, which
includes a one-line check to run after adding a token.

Values come from `docs/02-DESIGN-SYSTEM.md`. Where that document is silent, the
exact value is lifted out of the matching file in `design/` — never rounded to
a 4/8px grid, never replaced with a framework default.

## Reading order

Read these before changing anything:

1. `CLAUDE.md` — the standing rules
2. `docs/03-PAGES.md` — what each public page contains
3. `docs/02-DESIGN-SYSTEM.md` — every token
4. `docs/04-ADMIN.md` — the eleven admin modules
5. `docs/05-DATA-MODEL.md` — the collections

Build order is `docs/06-BUILD-PROMPTS.md`, phase by phase. Each phase ends with
something that runs.

`DECISIONS.md` records choices made where the documents were silent or where
the framework forced a deviation.

## Performance targets

Not aspirations — visitors are on Somali mobile data.

- Lighthouse performance **≥ 90 on mobile**
- Largest Contentful Paint **under 2.5s on 3G**
- No layout shift on font load

## A note on `docs/` and `design/`

Both are excluded from Prettier and ESLint. `docs/` is the specification and
`design/` is the approved screens — tooling must not reformat either. Nothing
in `design/` is ever imported and nothing in it ships.

If a decision changes, change the document first, then the code. Never leave
the two disagreeing.
