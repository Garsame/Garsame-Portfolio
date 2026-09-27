# 01 — Project Brief

## Purpose

A personal portfolio that presents Garsame Mohamud as an independent software
engineer, displays his whole body of work, and gives a business owner a clear
path to contacting and hiring him. It doubles as a publishing platform: a blog
he writes for, and a membership list he can broadcast to.

It is not a brochure. It is a system he operates daily from an admin area.

## Who it is for

1. **Business owners in Somalia and East Africa** — the primary audience. They
   are not technical. They want to know what problem he solves and what it will
   cost them.
2. **Recruiters and collaborators** — secondary. They read the project pages.
3. **Readers of the blog** — who may become either of the above.

## Identity

- Name: **GARSAME v3**
- Tagline: **Complex problems, simple software.**
- The `v3` is the spine of the whole site. Garsame has been three people —
  v1 the NGO field worker, v2 the student and builder, v3 the independent
  engineer. The site is presented as the current release of a person.
- Logo: not yet designed. Use the wordmark **GARSAME** in Plus Jakarta Sans 800
  with a `v3` chip beside it, per the design system.

## Language

English only. The code must not make a future Somali version impossible, but no
translation layer is built now.

## Public pages

| Route | Page |
|---|---|
| `/` | Home — thirteen sections, summarises everything |
| `/about` | The three versions, credentials, photo, CV |
| `/services` | What he does for a business, in full |
| `/projects` | All projects, filterable |
| `/projects/[slug]` | One project case study |
| `/blog` | All posts, filterable by category |
| `/blog/[slug]` | One post |
| `/testimonials` | All published testimonials + submission form |
| `/membership` | What membership is + join form |
| `/contact` | Contact details + enquiry form |
| `/privacy` | Privacy notice (required — the site collects names and emails) |
| `/404` | Designed, not default |

## Admin area

Eleven modules behind a login at `/admin`. Full specification in `04-ADMIN.md`.

Dashboard · Members · Updates (broadcasts) · Blog · Projects · Testimonials ·
Messages · Stats · Files · Branding & Look · Settings

## Locked decisions

These were settled in discussion. Do not revisit them during the build.

- Multi-page site with real routes and server rendering — not a single-page app
- Colours are **not** editable from the admin; everything else visible is
- Editor text sizing is by named level only
- Testimonials are publicly submittable and admin-approved before appearing
- No fabricated clients, logos, numbers or quotes anywhere on the site
- The blog publishes topics for readers; build notes belong on project pages
- Cards are plain rounded; the angled clipped corner belongs on buttons only
- Membership is free: a list of people who get his updates first

## Success

- A business owner lands on the home page and understands within ten seconds
  what Garsame does for a business like theirs.
- He can add a project, write a post, approve a testimonial and send an update
  to every member without touching the code.
- The site is found on Google for his name and for the kinds of systems he builds.

## Out of scope for version one

- Somali translation
- Paid membership or payments on this site
- Comments on blog posts
- A client portal
