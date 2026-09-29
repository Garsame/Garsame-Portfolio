/**
 * Home page content — hardcoded for Phase 3.
 *
 * Every string here is approved copy from docs/03-PAGES.md or read out of
 * design/01-home.html. Nothing is invented: where a real value does not exist
 * yet, the field is `null` or an empty list, and the component renders a
 * clearly bracketed placeholder — CLAUDE.md rule 10.
 *
 * The shapes follow docs/05-DATA-MODEL.md so that later phases can replace
 * each export with a database read without touching the components. Projects
 * moved to the database in Phase 6 (lib/projects.ts):
 *
 *   hero, clients, faq, services, processSteps, contact → settings  (Phase 9)
 *   latestPosts                                          → posts     (Phase 8)
 *   featuredTestimonials                                 → testimonials (Phase 11)
 */

/* ------------------------------------------------------------------ site */

export const site = {
  title: "GARSAME v3 — Complex problems, simple software.",
  /* A restatement of approved copy — the hero heading and the location — kept
     under the 160 characters a search result shows. Editable in Branding &
     Look from Phase 9. */
  metaDescription:
    "I build the system your business runs on. Software for businesses in Somalia and East Africa, by Garsame Mohamud, Mogadishu.",
};

/* ------------------------------------------------------------------ hero */

export type Availability = "available" | "limited" | "booked";

export type HeroBadge = {
  label: string;
  value: string;
  /** Which status family tints the icon tile — design/01-home section 01. */
  tone: "warning" | "success" | "accent";
  icon: "bolt" | "check" | "clock";
};

export const hero = {
  availability: "available" as Availability,
  availabilityText: "AVAILABLE FOR WORK",
  location: "MOGADISHU",

  headingLine1: "I build the system",
  headingLine2Prefix: "your business",
  /* The rotating words are read from design/33-admin-branding.html. The
     design system document lists "Health Care, Transport, Retail, Hiring",
     which does not complete the sentence — see DECISIONS.md D-033. The first
     word is the one the server renders and the one the rotation settles on. */
  rotatingWords: ["runs on", "depends on", "grows with"],

  paragraph:
    "Whatever you are handling today with notebooks, WhatsApp messages and separate spreadsheets — I turn it into one place your staff and your customers can use, on the phone and on the computer.",

  badges: [
    {
      label: "BUILDING NOW",
      value: "Heelan Health Care",
      tone: "warning",
      icon: "bolt",
    },
    {
      label: "LIVE TODAY",
      value: "SomaliNotes AI",
      tone: "success",
      icon: "check",
    },
    {
      label: "I REPLY IN",
      value: "Under 24 hours",
      tone: "accent",
      icon: "clock",
    },
  ] satisfies HeroBadge[],
};

/* ---------------------------------------------------------------- about */

/**
 * Short and long bio — from Garsame's CV and the About page's own v1/v2/v3
 * narrative. Previously duplicated as inline fallback strings in
 * lib/settings.ts; this is now the one place they are written.
 */
export const bio = {
  short:
    "I build the systems Somali businesses run on. Six years of field work before the first line of code.",
  long: "I did not come to software from a computer. I came to it from a registration desk in a displacement camp, where I watched good people lose an entire day to a form that should have taken two minutes.",
};

/** From the CV — linkedin.com/in/garsame-mohamud-iftin, github.com/Garsame. */
export const socialLinks = [
  {
    platform: "LinkedIn",
    url: "https://linkedin.com/in/garsame-mohamud-iftin",
  },
  { platform: "GitHub", url: "https://github.com/Garsame" },
];

/* --------------------------------------------------------------- clients */

/**
 * DECISIONS.md D-002 — real clients only, and Save the Children is a v1
 * employer rather than a client. Each carries an optional avatar (a small
 * logo or photo for the hero proof-row stack), set in Settings — none is
 * seeded here, since there is no real image to point at yet. D-139.
 */
export const clients: { name: string }[] = [
  { name: "Heelan Home Health Care" },
  { name: "MGH" },
  { name: "Hormuud University" },
  { name: "Carshi Restaurant" },
];

/* --------------------------------------------------------------- promise */

export const promises = [
  {
    title: "It works when the network does not",
    body: "Your staff will not lose a sale or a patient record because the signal dropped. That is designed in from the first day.",
  },
  {
    title: "Your customers pay the way they already pay",
    body: "Money arrives through the mobile wallets everyone here uses, and every payment is checked before it is accepted.",
  },
  {
    title: "It belongs to you",
    body: "Yours to keep, on your own server, with everything written down. You are never trapped with one person.",
  },
];

/* -------------------------------------------------------------- services */

export type ServiceIcon =
  "screen" | "phone" | "chart" | "mail" | "automation" | "support";

export const services: {
  title: string;
  description: string;
  icon: ServiceIcon;
}[] = [
  {
    title: "One place for the whole business",
    description:
      "No more notebooks, group chats and three different spreadsheets. Your staff open one screen and everything is there.",
    icon: "screen",
  },
  {
    title: "An app in your customers' hands",
    description:
      "They order, book and pay from their own phone, at any hour, without calling anyone or waiting for a reply.",
    icon: "phone",
  },
  {
    title: "Know what is happening, daily",
    description:
      "Sales, stock, bookings and staff on one screen, updated as it happens — so you decide from facts, not from memory.",
    icon: "chart",
  },
  {
    title: "Messages and receipts send themselves",
    description:
      "Confirmations, reminders, receipts and follow-ups go out on their own. Your team stops typing the same message every day.",
    icon: "mail",
  },
  {
    title: "Let the computer do the repeated work",
    description:
      "Reading documents, sorting applications, writing up summaries — the tasks that eat a whole morning, done in seconds.",
    icon: "automation",
  },
  {
    title: "Someone to call when it breaks",
    description:
      "A monthly plan that keeps it running, backed up and updated — and a person who answers, not a ticket number.",
    icon: "support",
  },
];

/* -------------------------------------------------------- three versions */

export const versions = {
  paragraph:
    "Because I have been three people, and each one taught the next something a classroom could not. The engineer you would hire today is the third version — and the first two are the reason he is worth hiring.",
  items: [
    {
      tag: "v1",
      title: "The field",
      body: "Years across Somalia with DRC, MUDRO, PAH and Save the Children — registration, procurement, logistics. I learned where organisations actually break, and it is almost never where the plan says.",
    },
    {
      tag: "v2",
      title: "The builder",
      body: "Computer Science at Hormuud University, on top of a Public Administration degree from Kismayo. A final-year platform for Somali lecture notes, and research presented at HUMC 2026.",
    },
    {
      tag: "v3",
      title: "The engineer",
      body: "Independent, building for businesses here. Systems that have to work on the first day and still work on the hundredth — with the judgement to cut what will not survive real conditions.",
    },
  ],
};

/* --------------------------------------------------------------- process */

export const process = {
  sub: "Five steps, in order, every time. You always know which one we are in and what comes next.",
  steps: [
    {
      title: "We talk",
      description:
        "I come and see how the work is done today, not how it is described in a meeting.",
    },
    {
      title: "We agree the price",
      description:
        "Written down, fixed, split into phases. No surprise invoice, ever.",
    },
    {
      title: "I build",
      description:
        "In phases, and at the end of each one you get something you can open and try.",
    },
    {
      title: "You go live",
      description:
        "On your own server, with your staff trained and everything written down for you.",
    },
    {
      title: "I stay",
      description:
        "Updates, backups and fixes every month, for as long as you want me there.",
    },
  ],
};

/* ---------------------------------------------------------- testimonials */

export type Testimonial = {
  name: string;
  role?: string;
  business?: string;
  quote: string;
};

/**
 * Empty until real quotes are published — rule 6, nothing appears without
 * approval. With fewer than two, the ink card fills the rest of the row.
 * DECISIONS.md D-001.
 */
export const featuredTestimonials: Testimonial[] = [];

/* ------------------------------------------------------------------- faq */

export type FaqItem = {
  question: string;
  /** `null` until written — the component renders a bracketed placeholder. */
  answer: string | null;
};

export const faq = {
  sub: "The five things every client asks in the first call, answered here — so the first call can be about your business instead.",
  items: [
    {
      question: "What will it cost me?",
      answer:
        "It depends on what you need, and I will not pretend otherwise. What I will do is give you one written price before any work begins, split into phases, so you always know what is coming. Smaller systems cost less than most people expect.",
    },
    /* Drafted at Garsame's request so the site is not left with unanswered
       questions while real answers wait — he will revise these in the
       admin. Each restates a promise or process step already approved
       elsewhere on the page, rather than a new claim. */
    {
      question: "How long will it take?",
      answer:
        "It depends on the size of the system, but you will never be waiting in the dark. The work is split into phases, and at the end of each one you get something you can open and try — not a promise, an actual screen.",
    },
    {
      question: "Do I own it afterwards?",
      answer:
        "Yes. The code, the database and the server are yours, with everything written down. If you ever decide to work with someone else, you can hand it over in an afternoon.",
    },
    {
      question: "My staff are not technical. Can they use it?",
      answer:
        "That is the test I build to. If the person at the counter cannot use it on their first morning without help, I have not finished the job. Training is part of going live, not an extra.",
    },
    {
      question: "What happens after it goes live?",
      answer:
        "I stay. Updates, backups and fixes happen every month for as long as you want me there, and if something breaks you call me — not a ticket number.",
    },
  ] satisfies FaqItem[],
};

/* ------------------------------------------------------------------ blog */

export type PostCategory = "technology" | "business" | "ai" | "process";

export type PostSummary = {
  slug: string;
  number: number;
  title: string;
  excerpt: string;
  category: PostCategory;
  publishedAt: string;
  readingTime: number;
};

/**
 * Empty until Phase 8. design/01-home.html shows three sample posts, but none
 * of them exists: their dates, reading times and "# 012" numbering would be
 * invented figures on a live page. DECISIONS.md D-034.
 */
export const latestPosts: PostSummary[] = [];

/* ------------------------------------------------------------ membership */

export const membership = {
  heading: "Be the first to see what I build next",
  paragraph:
    "Members hear about new systems, new writing and what I have learned before anyone else. No noise, nothing sold to anyone, leave whenever you want.",
  formTitle: "Become a member",
  reassurance:
    "Your details stay with me. One message at a time, never a flood.",
};

/* --------------------------------------------------------------- contact */

export const contact = {
  paragraph:
    "Tell me what is slowing your business down. If I am the right person for it, I will say so and give you a price. If I am not, I will tell you that too.",
  phone: "+252 616 172 443" as string | null,
  email: "garsame40@gmail.com",
  location: "Mogadishu, Somalia",
};

/** The contact form's "What do you need?" options: the six services by name,
    plus a way out. DECISIONS.md D-035. */
export const needOptions = [...services.map((s) => s.title), "Something else"];
