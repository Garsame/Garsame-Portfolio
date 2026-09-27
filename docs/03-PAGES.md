# 03 — Public Pages

The approved home page design is the reference for every pattern here. Copy in
this document is final unless marked `[PLACEHOLDER]`.

## Global

### Header — sticky

Left: `GARSAME` wordmark (800, -0.03em) + `v3` chip (blue fill, white mono,
6px clip). Centre: Home · About · Services · Projects · Blog · Testimonials ·
Membership · Contact. Right: **Start a Project** button (blue, 11px clip).

Current page is blue and 600 weight. Below 1024px the nav becomes a full-screen
sheet, 250ms fade and 8px rise.

### Footer

Wordmark left, nav links centre, `© 2026 Garsame Mohamud` right. Background
`--tint`, top border.

---

## `/` Home — thirteen sections

### 01 Hero

- Status line, mono: `GARSAME v3.0 | MOGADISHU | ● AVAILABLE FOR WORK`
  (the dot and text in `--success`; driven by the availability setting)
- Heading: **I build the system** / **your business `runs on`**
- Paragraph: "Whatever you are handling today with notebooks, WhatsApp messages
  and separate spreadsheets — I turn it into one place your staff and your
  customers can use, on the phone and on the computer."
- Buttons: **Start a Project** (primary), **See the projects** (secondary)
- Proof row: avatar stack + "Working with **Heelan, MGH, Hormuud University**
  and Carshi Restaurant"
- Right: three stacked circles — 460px `#EEF2FE`, 370px `#D7DFFB`, 280px
  `--blue` — with the cut-out portrait standing taller so the head breaks above
  them. Three floating badges around it:
  - top left — `BUILDING NOW` / Heelan Health Care (amber icon tile)
  - middle right — `LIVE TODAY` / SomaliNotes AI (green icon tile)
  - bottom left — `I REPLY IN` / Under 24 hours (blue icon tile)

### 02 Promise band — blue

Three items, each `/ 00n` + heading + two lines:

1. **It works when the network does not** — "Your staff will not lose a sale or
   a patient record because the signal dropped. That is designed in from the
   first day."
2. **Your customers pay the way they already pay** — "Money arrives through the
   mobile wallets everyone here uses, and every payment is checked before it is
   accepted."
3. **It belongs to you** — "Yours to keep, on your own server, with everything
   written down. You are never trapped with one person."

### 03 Services — tint

Eyebrow `// What I do for you`. Heading **How can I help your `business`**.
Sub: "You tell me what is slow, confusing or costing you money. I build the
thing that fixes it."

Six cards, 3 × 2, each: icon tile, index number top-right, heading, two lines.

1. **One place for the whole business** — "No more notebooks, group chats and
   three different spreadsheets. Your staff open one screen and everything is there."
2. **An app in your customers' hands** — "They order, book and pay from their
   own phone, at any hour, without calling anyone or waiting for a reply."
3. **Know what is happening, daily** — "Sales, stock, bookings and staff on one
   screen, updated as it happens — so you decide from facts, not from memory."
4. **Messages and receipts send themselves** — "Confirmations, reminders,
   receipts and follow-ups go out on their own. Your team stops typing the same
   message every day."
5. **Let the computer do the repeated work** — "Reading documents, sorting
   applications, writing up summaries — the tasks that eat a whole morning,
   done in seconds."
6. **Someone to call when it breaks** — "A monthly plan that keeps it running,
   backed up and updated — and a person who answers, not a ticket number."

### 04 Projects — white

Eyebrow `// Projects`. Heading **Systems that are `running`**. Secondary button
**See all projects**.

Three featured project cards from the database, ordered by the admin's featured
order. Card: cover image with `/ 00n` overlay, status chip, year, title,
summary, "See the project →".

### 05 The three versions — tint

Eyebrow `// About me`. Heading **Why the name says `v3`**. Paragraph, then
"Read the full story →" to `/about`.

Right: three cards, v1 / v2 / v3. The v3 card is `--accent-soft` with a blue
border. Copy as in the design.

### 06 Full-bleed break — accent-wash

One full-width project screenshot, 340px tall. Chosen in Settings.

### 07 Process — white

Eyebrow `// Process`. Heading **How we get `there`**. Five columns with a 2px
top rule — blue on step one, `--blue-pale` on the rest.

We talk · We agree the price · I build · You go live · I stay.

### 08 Working with — tint

Mono label `// Working with`, then client names in 19px 700 `#7D89AE`. Real
names only, from Settings.

### 09 Testimonials — white

Eyebrow `// In their words`. Heading **What the people I built for `say`**.
Primary button **Write a testimonial** → `/testimonials#submit`.

Up to two published testimonials, then the ink "your turn" card inviting
submission. If fewer than two are published, fill the row with the ink card only
— never with placeholder quotes.

### 10 FAQ — tint

Eyebrow `// Questions`. Heading **Before you `get in touch`**. Accordion, first
item open, blue border on the open item.

1. What will it cost me?
2. How long will it take?
3. Do I own it afterwards?
4. My staff are not technical. Can they use it?
5. What happens after it goes live?

Answers are editable in Settings.

### 11 Blog — white

Eyebrow `// Blog`. Heading **Latest from the `blog`**. Sub: "Topics I publish on
technology, business and building software in Somalia — written to be read, not
to be skimmed." Secondary button **Visit the blog**.

Three latest published posts: cover with `# 0nn`, category, title, excerpt,
date and reading time.

### 12 Membership — ink band

Eyebrow `// Membership`. Heading **Be the first to see what I build next**.
Paragraph. Right: white card with the join form — first name, last name, email,
**Join**, and the reassurance line.

### 13 Contact — white

Eyebrow `// Stay connected`. Heading **Let's work `together`**. Paragraph, then
phone, email and location with icon tiles. Right: enquiry form — full name,
email, business name, "What do you need?" select, message, **Send message**.

---

## `/about`

The three versions told properly: v1 the field, v2 the builder, v3 the engineer.
Portrait. Credentials — Computer Science at Hormuud University, Public
Administration at the University of Kismayo, research presented at HUMC 2026.
CV download. Ends with the contact call to action.

## `/services`

The six services in full, one section each: what it is, who it is for, what
changes for the business, and what a typical engagement looks like. Ends with
the process strip and the contact call to action. Still no framework names.

## `/projects`

All published projects, newest first within the admin's manual order. Filter
chips by type: All · Web app · Mobile app · Platform · Website. Featured
projects appear first.

## `/projects/[slug]`

Header on the ink band: client, year, status, title, summary.
Then, in order, rendering only the blocks that have content:

The problem · Constraints and what I cut · What I built · Key decisions ·
Outcome · Gallery · **Stack** (the only place technology is named) ·
Role and team · Timeline · Links · any custom sections.

Ends with: a testimonial from that client if one is published, then previous /
next project.

## `/blog`

Featured post large at the top, then the rest in a readable grid. Category
filter. Newest first. Right rail on desktop: categories and the membership
invitation.

## `/blog/[slug]`

Cover, category, title, date, reading time. Body at 680px measure, 19px, line
height 1.7. Table of contents pinned on desktop, collapsed on mobile. Thin blue
reading-progress line at the top of the window. Code blocks with a copy button.
Ends with a two-line author card, the membership invitation and two related posts.

## `/testimonials`

All published testimonials in a grid. `#submit` anchor to the form: name,
role, business, email (private, for verification), photo (optional), the
testimonial, and a consent checkbox. On submit, a thank-you state explaining
that Garsame reviews each one before it appears.

## `/membership`

What a member gets, in plain terms. The join form. What you will never do with
their details. Unsubscribe explained.

## `/contact`

The contact section, expanded. Form, direct channels, response time,
availability status.

## `/privacy`

Short and plain: what is collected (name, email, message), why, how long it is
kept, that it is never sold or shared, and how to ask for deletion.

## `/404`

Designed. The wordmark, "That page does not exist", and links to Home, Projects
and Blog.
