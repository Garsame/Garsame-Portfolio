# 04 — Admin

Everything at `/admin`, behind NextAuth. Garsame is the only admin. There is no
public sign-up and no second role.

## Shell

Left sidebar with the eleven modules, top bar with the page title and the
primary action, content area on `--tint`. Same design system as the public site:
same colours, same type, same clipped-corner buttons, plain rounded cards.

Modules: Dashboard · Members · Updates · Blog · Projects · Testimonials ·
Messages · Stats · Files · Branding & Look · Settings

## 1. Dashboard

The one screen that answers "what is happening".

- Four tiles: total members (and new this week), unread messages, pending
  testimonials, published posts
- A line chart of member growth over the last 90 days
- A bar chart of page views over the last 30 days
- Recent activity list: last 10 events across members joining, messages
  arriving, testimonials submitted, posts published
- Anything needing attention, as a single list: unread messages, pending
  testimonials, failed email sends, drafts older than 30 days

## 2. Members

- Table: name, email, joined date, status (active / unsubscribed), source
- Search, sort, filter by status
- Export to CSV
- Remove a member (confirmation required)
- Open a member to see which broadcasts they received

New members receive a welcome email automatically. Every member row links to an
unsubscribe token; unsubscribing sets status rather than deleting the record.

## 3. Updates — broadcasts

The engine of the membership. Without this, the member list does nothing.

- Compose with the same block editor as the blog
- Subject line, preview text, body
- **Send a test to myself** before anything goes out
- Recipient count shown before sending, with a confirmation step naming the
  number
- Send, or schedule for a date and time
- After sending: a record of recipients, delivered, failed, and opened if
  tracking is enabled
- **Mail log** — every individual send with recipient, status, timestamp and
  error text. Failed sends can be retried individually or in bulk.

Sending is queued and throttled so an SMTP provider does not reject the batch.
A broadcast to 400 members must never be a black box.

## 4. Blog

- List with status, category, date, views; search and filter
- New post starts from a template: Case note · Technical explainer ·
  Short opinion · Blank
- Required to publish: title, slug, excerpt (160 char cap), cover image, category
- Optional: tags, featured flag, series, custom SEO title and description
- States: Draft · Published · Archived, plus schedule for later
- Publish is blocked with a clear message if a required field is missing or the
  slug collides
- **Page preview** — the exact public post rendered from the current form,
  including unsaved changes
- **Card preview** — beside the excerpt field, showing the card as it appears on
  the blog index and the home page
- Reading time and the table of contents generate from the content

## 5. Projects

- List with drag-to-reorder; the order shown is the order visitors see
- Featured switch, limited to three; featured projects appear on the home page
  in the chosen order
- **Required to publish**: title, slug, client or context, year, type, status,
  one-line summary (120 char cap), cover image, the problem, what I built,
  stack tags
- **Optional blocks**, which do not render when empty: constraints and what I
  cut, key decisions, outcome, gallery, live URL, repository URL, role and team,
  client quote, timeline
- **Custom sections**: repeatable heading + rich text + optional image, added as
  many times as a project needs
- States and publish validation as for the blog
- Page preview and card preview, as for the blog

## 6. Testimonials

- Inbox of submissions with status: Pending · Published · Rejected
- Each shows name, role, business, email, photo, the text, and when it arrived
- Actions: publish, edit (typos only — never change their meaning), feature,
  reject, delete
- Featured testimonials appear on the home page; all published ones appear on
  `/testimonials`
- Drag-to-reorder published testimonials
- Optional: link a testimonial to a project so it appears on that project page
- Garsame is emailed when a new testimonial arrives

**Nothing appears publicly until it is published here.** This is a hard rule.

## 7. Messages

- Inbox from the contact form: name, email, business, need, message, received at
- Read / unread, with unread counts in the sidebar and on the dashboard
- Reply opens the user's mail client with the address and subject prefilled, or
  sends through SMTP and logs it
- Archive and delete
- Garsame is emailed when a message arrives

## 8. Stats

- Page views over time, by page
- Top projects and top posts by views
- Member growth
- Referrers
- Simple first-party counting written to the database — no third-party script,
  no cookie banner needed

## 9. Files

- Upload images and documents, stored on the server with generated thumbnails
- Grid with search and filter by type
- Copy URL, rename, replace, delete
- Shows which post or project uses a file before allowing deletion
- Accepts jpg, png, webp, svg, pdf; 10MB per file; images converted to webp

## 10. Branding & Look

Everything visible on the site that is not a colour.

- Logo (upload, with fallback to the wordmark)
- Hero heading, hero paragraph, the rotating word list
- Hero portrait
- The three hero badges — label, value, icon colour
- The full-bleed break image
- Social links
- CV file
- Meta description and the social sharing image
- Availability status, which drives the green line in the hero

**No colour controls anywhere.** Colours are in code, by design, so the system
cannot be broken from here.

## 11. Settings

- Bio, short and long
- Contact details: phone, email, location
- Client list for the "Working with" row
- FAQ questions and answers
- Service card text
- Process step text
- SMTP configuration and a **send test email** button
- Change admin password

## The editor — shared by Blog, Projects and Updates

Built on TipTap, stored as JSON, with plain text stored alongside for search and
excerpts.

**Three ways to insert**

- The `+` button in the left margin of the current line, opening the block pane
- Typing `/` anywhere, opening the same menu at the cursor
- Keyboard shortcuts and markdown-style input rules (`##` then space)

**Selection toolbar** — appears above highlighted text: bold, italic, link,
inline code, heading level, clear formatting.

**Blocks**

Paragraph · Heading · Sub-heading · Bold, italic, inline code, links ·
Bulleted and numbered lists · Quote · Code block with language and syntax
highlighting · Image with alt text, caption and width (inline, wide, full-bleed) ·
Divider · Callout · Embed (YouTube or a link card)

**Text sizing is by named level only** — Heading, Sub-heading, Body, Small.
There is no font-size control. This is deliberate.

**While writing** — autosave every few seconds with a saved indicator, undo and
redo, word count and reading time, and a distraction-free mode that hides the
admin chrome.

## Security

- Rate-limit every public form: contact, membership, testimonials
- Honeypot field plus a time-to-submit check on public forms
- Sanitise all editor HTML on output
- Validate every field on the server
- Signed, httpOnly session cookies; CSRF protection on all mutations
- Uploads: type and size checked server-side, filenames randomised, no execution
- Admin routes protected by middleware, not only by UI
