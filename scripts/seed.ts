/**
 * Seed — docs/06-BUILD-PROMPTS.md Phase 4.
 *
 *   npm run db:seed                         create what is missing
 *   npm run db:seed -- --reset-admin-password   set the admin password from env
 *
 * Creates the one admin user from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME,
 * the site settings document from the approved copy in lib/content/home.ts
 * (itself taken from docs/03-PAGES.md and design/), and the three projects in
 * ./seed-projects.ts.
 *
 * Safe to run any number of times. It never overwrites: an existing admin
 * keeps its password unless --reset-admin-password is passed, and existing
 * settings — which Garsame edits in the admin from Phase 9 — are left alone.
 *
 * It builds every index first. "Uniqueness enforced at the database level"
 * only holds once the unique indexes exist; Mongoose's autoIndex is normally
 * off in production, so the seed creates them deliberately.
 */

import mongoose from "mongoose";
import { dbConnect } from "../lib/db";
import {
  clients,
  contact,
  faq,
  hero,
  process as processContent,
  services,
  site,
} from "../lib/content/home";
import { ALL_MODELS, Settings, User } from "../models";
import { seedProjects } from "./seed-projects";
import { seedPosts } from "./seed-posts";
import { seedMembersAndMessages } from "./seed-members-messages";
import { seedStats } from "./seed-stats";

const args = new Set(process.argv.slice(2));
const log = (line: string) => console.log(`  ${line}`);

async function buildIndexes() {
  for (const model of ALL_MODELS) {
    await model.createIndexes();
  }
  log(`indexes    ${ALL_MODELS.length} collections indexed`);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || undefined;

  const existing = await User.findOne().select("+passwordHash");

  if (existing) {
    if (args.has("--reset-admin-password")) {
      if (!password) throw new Error("Set ADMIN_PASSWORD to reset it.");
      await existing.setPassword(password);
      await existing.save();
      log(`admin      password reset for ${existing.email}`);
    } else {
      log(`admin      exists (${existing.email}) — left unchanged`);
    }
    return;
  }

  if (!email || !password) {
    throw new Error(
      "No admin account yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local, then run the seed again.",
    );
  }

  const admin = new User({ email, name });
  await admin.setPassword(password);
  await admin.save();
  log(`admin      created (${admin.email})`);
}

async function seedSettings() {
  if (await Settings.exists({ key: "site" })) {
    log("settings   exist — left unchanged");
    return;
  }

  /* SMTP host and sender are seeded from the environment when present. The
     password is not: it is stored encrypted, and encryption arrives with the
     mail module in Phase 10. */
  const smtp = process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER || undefined,
        fromName: process.env.SMTP_FROM_NAME || undefined,
        fromEmail: process.env.SMTP_FROM_EMAIL || undefined,
      }
    : undefined;

  await Settings.create({
    key: "site",

    /* Not in docs/ or design/ — left empty rather than invented (rule 10).
       Written in Settings in Phase 9. */
    bioShort: undefined,
    bioLong: undefined,
    socialLinks: [],

    phone: contact.phone ?? undefined,
    email: contact.email,
    location: contact.location,

    availability: hero.availability,
    availabilityText: hero.availabilityText,

    heroHeadingLine1: hero.headingLine1,
    heroHeadingLine2Prefix: hero.headingLine2Prefix,
    heroRotatingWords: hero.rotatingWords,
    heroParagraph: hero.paragraph,
    heroBadges: hero.badges.map(({ label, value, tone }) => ({
      label,
      value,
      tone,
    })),

    clients,
    faq: faq.items.map((item, order) => ({
      question: item.question,
      answer: item.answer ?? undefined,
      order,
    })),
    services: services.map((s, order) => ({
      title: s.title,
      description: s.description,
      icon: s.icon,
      order,
    })),
    processSteps: processContent.steps.map((step, order) => ({
      title: step.title,
      description: step.description,
      order,
    })),

    metaDescription: site.metaDescription,
    smtp,
  });

  const unanswered = faq.items.filter((i) => !i.answer).length;
  log(
    `settings   created — ${services.length} services, ${processContent.steps.length} steps, ${clients.length} clients, ${faq.items.length} FAQ (${unanswered} awaiting answers)`,
  );
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local.");
  }

  const conn = await dbConnect();
  console.log(`\nSeeding ${conn.connection.name} on ${conn.connection.host}\n`);

  await buildIndexes();
  /* Content first: it needs nothing from the environment, so a missing admin
     password does not also stop the site content being seeded. */
  await seedSettings();
  await seedProjects(log);
  await seedPosts();
  await seedMembersAndMessages();
  await seedStats();
  await seedAdmin();

  console.log("\nDone.\n");
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nSeed failed: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
