# 05 — Data Model

MongoDB with Mongoose. Every collection has `createdAt` and `updatedAt`.

## `users` — admin only

```
email        String   unique, required
passwordHash String   required
name         String
lastLoginAt  Date
```

Seeded by a script. No public registration.

## `projects`

```
title         String   required
slug          String   required, unique, indexed
client        String   required     // "Heelan Home Health Care", "Final Year Project"
year          Number   required
type          String   required     // web-app | mobile-app | platform | website
status        String   required     // live | building | completed | concept
summary       String   required, max 120
coverImage    ObjectId ref: files, required
problem       String   required
body          Object   required     // editor JSON
bodyText      String                // plain text, for search
stack         [String] required

// optional blocks — omit from render when empty
constraints   Object
decisions     [{ decision: String, reason: String }]
outcome       Object
gallery       [{ file: ObjectId ref files, caption: String }]
liveUrl       String
repoUrl       String
role          String
team          [String]
clientQuote   ObjectId ref: testimonials
timeline      String
customSections [{ heading: String, body: Object, image: ObjectId ref files }]

// control
state         String   required, default 'draft'   // draft | published | archived
featured      Boolean  default false               // max 3 enforced in the API
position      Number   required                    // manual drag order
publishedAt   Date
views         Number   default 0
seoTitle      String
seoDescription String
```

Indexes: `slug` unique, `{ state: 1, position: 1 }`, `{ featured: 1, position: 1 }`.

## `posts`

```
title       String   required
slug        String   required, unique, indexed
excerpt     String   required, max 160
coverImage  ObjectId ref: files, required
category    String   required     // technology | business | ai | process
tags        [String]
body        Object   required     // editor JSON
bodyText    String
readingTime Number                // computed on save
toc         [{ level: Number, text: String, anchor: String }]  // computed on save

state       String   required, default 'draft'   // draft | published | archived
featured    Boolean  default false               // max 1 enforced in the API
publishedAt Date
scheduledFor Date
views       Number   default 0
series      String
seoTitle    String
seoDescription String
```

Indexes: `slug` unique, `{ state: 1, publishedAt: -1 }`, `{ category: 1 }`.

## `testimonials`

```
name       String  required
role       String
business   String
email      String  required        // private, never rendered publicly
photo      ObjectId ref: files
quote      String  required, max 600
consent    Boolean required        // must be true to submit
project    ObjectId ref: projects  // optional link

status     String  required, default 'pending'   // pending | published | rejected
featured   Boolean default false
position   Number
submittedIp String
publishedAt Date
```

Index: `{ status: 1, position: 1 }`.

## `members`

```
firstName    String required
lastName     String
email        String required, unique, indexed
status       String required, default 'active'   // active | unsubscribed
source       String                              // home | membership | blog | footer
unsubToken   String required, unique
joinedAt     Date   required
unsubscribedAt Date
```

## `broadcasts`

```
subject      String required
previewText  String
body         Object required
bodyText     String
state        String required, default 'draft'   // draft | scheduled | sending | sent | failed
scheduledFor Date
sentAt       Date
recipientCount Number
deliveredCount Number
failedCount    Number
```

## `maillogs`

Every send, without exception.

```
type       String required          // welcome | broadcast | contact-notify | testimonial-notify | test
broadcast  ObjectId ref: broadcasts
to         String required
subject    String required
status     String required          // queued | sent | failed | bounced
error      String
attempts   Number default 0
sentAt     Date
```

Indexes: `{ broadcast: 1, status: 1 }`, `{ sentAt: -1 }`.

## `messages` — contact form

```
name       String required
email      String required
business   String
need       String                  // the select value
message    String required
read       Boolean default false
archived   Boolean default false
ip         String
```

## `files`

```
filename     String required        // randomised on disk
originalName String required
mimeType     String required
size         Number required
width        Number
height       Number
url          String required
thumbUrl     String
alt          String
usedBy       [{ model: String, id: ObjectId }]
```

## `settings` — a single document

```
key: 'site'

bioShort, bioLong           String
phone, email, location      String
socialLinks                 [{ platform, url }]
cvFile                      ObjectId ref: files
logo                        ObjectId ref: files
availability                String    // available | limited | booked
availabilityText            String

heroHeadingLine1            String
heroHeadingLine2Prefix      String
heroRotatingWords           [String]
heroParagraph               String
heroPortrait                ObjectId ref: files
heroBadges                  [{ label, value, tone }]   // exactly 3
breakImage                  ObjectId ref: files

clients                     [String]
faq                         [{ question, answer, order }]
services                    [{ title, description, icon, order }]
processSteps                [{ title, description, order }]

metaDescription             String
socialImage                 ObjectId ref: files

smtp                        { host, port, secure, user, passEncrypted, fromName, fromEmail }
```

## `pageviews`

```
path       String required
referrer   String
sessionId  String
viewedAt   Date required
```

Aggregated nightly into `stats_daily` so the dashboard never scans the raw
collection. Store no personal data here — no IP, no user agent fingerprint.

## Rules

- Slugs are generated from the title and remain editable; uniqueness enforced at
  the database level, not only in the form.
- Publish validation runs on the server. A document cannot reach `published`
  without its required fields.
- `featured` limits (3 projects, 1 post) are enforced in the API, not the UI.
- Deleting a file is refused while `usedBy` is not empty.
- Unsubscribing sets `status`; it never deletes the member record.
