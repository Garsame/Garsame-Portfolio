# START HERE — Garsame v3 Portfolio

Everything needed to build this site is in this folder. Nothing else is required.

## What is in here

```
garsame-v3/
├── START-HERE.md          this file
├── CLAUDE.md              the standing rules — Claude Code reads this automatically
├── docs/
│   ├── 01-PROJECT-BRIEF.md
│   ├── 02-DESIGN-SYSTEM.md
│   ├── 03-PAGES.md
│   ├── 04-ADMIN.md
│   ├── 05-DATA-MODEL.md
│   └── 06-BUILD-PROMPTS.md
└── design/                30 approved screens as real HTML
    ├── 01-home.html ... 11-404.html          the public site
    ├── 20-admin-login.html ... 34-admin-settings.html   the admin
    └── 40-logo-a.html ... 43-logo-d.html     logo options, parked
```

## How Claude Code builds *exactly* what the design shows

The files in `design/` are not pictures. They are working HTML with every real
value already in them — hex colours, font sizes, letter-spacing, padding, radii,
grid columns, the clip-path on the buttons. Claude Code opens them and reads the
numbers instead of guessing from a screenshot.

**Open any of them in your browser right now** — double-click the file — and you
will see the approved screen exactly as it will look.

Two rules keep the build faithful:

1. Values come from `docs/02-DESIGN-SYSTEM.md`, which is the source of truth.
2. When something is not in that document, Claude Code lifts the exact value out
   of the matching file in `design/` — never rounds it, never substitutes a
   framework default.

The design files are reference only. They are not the app, they never get
imported, and nothing in `design/` ships to the server.

## How to start

1. Put this folder wherever you keep your work.
2. Open a terminal in this folder and run `claude`.
3. Paste this as your first message:

```
Read START-HERE.md, then CLAUDE.md, then every file in docs/, in order.
Then open design/01-home.html and design/21-admin-dashboard.html so you can see
what we are building.

Do not write any code yet. When you have read everything, tell me in a short list
what you understand the project to be, what the stack is, and what Phase 0 will
produce. I will confirm before you start.
```

4. Read what comes back. If anything is wrong, correct it before a single file is
   written — that is the cheapest possible moment to catch a misunderstanding.
5. When it is right, paste the **Phase 0** prompt from `docs/06-BUILD-PROMPTS.md`.

From there, one phase at a time, in order. Run each phase, look at the result,
then move on.

## The order of the phases

| Phase | What you get | Needs from you |
|---|---|---|
| 0 | Project set up, tokens in place | — |
| 1 | The UI kit, plus a `/dev/ui` page to review | — |
| 2 | Header, footer, transitions, every route stubbed | — |
| 3 | The whole home page | — |
| 4 | Database models and seed | domain name |
| 5 | Admin login and dashboard | — |
| 6 | Projects, end to end | project write-ups, images |
| 7 | The block editor | — |
| 8 | The blog | 2–3 posts |
| 9 | Files, branding, settings | photo, phone, socials, CV |
| 10 | Forms, email, members | SMTP details |
| 11 | Testimonials and broadcasts | quotes from Heelan and MGH |
| 12 | Stats, SEO, polish | — |
| 13 | Deployment | VPS access |

**Phases 0 to 3 need nothing from you.** Start today.

## A rule worth keeping

If you change your mind about anything, change the document first, then tell
Claude Code to re-read it. Never leave the code and the specification disagreeing
— that is how a project stops being buildable from its own documents.
