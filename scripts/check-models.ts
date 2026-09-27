/**
 * Check the data rules — npm run db:check
 *
 * Runs every rule the models claim to enforce against a real MongoDB, in a
 * throwaway database created for the run and dropped at the end. It never
 * touches the database in MONGODB_URI itself: only the host is borrowed.
 *
 * Exits non-zero if any check fails. Worth running after changing a model.
 */

import mongoose from "mongoose";
import { plainText, readingTime, tableOfContents } from "../lib/editor-content";
import { sanitizeDoc } from "../lib/editor-schema";
import { docToText, textToDoc } from "../lib/editor-text";
import { hashPassword, verifyPassword } from "../lib/password";
import { slugify } from "../lib/slug";
import {
  ALL_MODELS,
  Broadcast,
  MailLog,
  Member,
  Post,
  Project,
  RuleViolation,
  Settings,
  StoredFile,
  Testimonial,
  User,
  type ISettings,
} from "../models";

let passed = 0;
let failed = 0;

async function check(name: string, fn: () => unknown | Promise<unknown>) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok    ${name}`);
  } catch (error) {
    failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  FAIL  ${name}\n        ${message}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Expect `fn` to reject with a RuleViolation naming every one of `paths`. */
async function rejects(fn: () => Promise<unknown>, paths: string[]) {
  try {
    await fn();
  } catch (error) {
    if (paths.length === 0) return;
    assert(
      error instanceof RuleViolation ||
        error instanceof mongoose.Error.ValidationError,
      `expected a validation error, got: ${(error as Error).message}`,
    );
    const got = Object.keys(
      (error as mongoose.Error.ValidationError).errors ?? {},
    );
    for (const p of paths) {
      assert(got.includes(p), `expected an error on "${p}", got [${got}]`);
    }
    return;
  }
  throw new Error("expected this to be rejected, but it succeeded");
}

async function rejectsWith(fn: () => Promise<unknown>, text: string) {
  try {
    await fn();
  } catch (error) {
    const message = (error as Error).message;
    assert(message.includes(text), `expected "${text}", got "${message}"`);
    return;
  }
  throw new Error("expected this to be rejected, but it succeeded");
}

const doc = (...blocks: object[]) => ({ type: "doc", content: blocks });
const p = (text: string) => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});
/** Everything a project needs before it can be published. */
const complete = (title: string, fileId: mongoose.Types.ObjectId) => ({
  title,
  client: "A client",
  year: 2026,
  type: "web-app" as const,
  status: "live" as const,
  summary: "A one-line summary.",
  coverImage: fileId,
  problem: "The problem.",
  body: doc(p("What I built.")),
  stack: ["Next.js"],
});

const h = (level: number, text: string) => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to run the model checks with NODE_ENV=production.",
    );
  }
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017";
  const dbName = `garsame_check_${Date.now()}`;

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
  console.log(`\nChecking rules in a throwaway database: ${dbName}\n`);

  try {
    for (const model of ALL_MODELS) await model.createIndexes();

    const fileId = new mongoose.Types.ObjectId();

    console.log("helpers");
    await check("slugify makes a clean slug", () => {
      assert(
        slugify("Can AI understand Somali — well enough?") ===
          "can-ai-understand-somali-well-enough",
        slugify("Can AI understand Somali — well enough?"),
      );
    });
    await check("reading time is words / 200, rounded up, min 1", () => {
      const words = Array.from({ length: 450 }, () => "word").join(" ");
      assert(readingTime(doc(p(words))) === 3, "450 words should be 3 min");
      assert(readingTime(doc()) === 1, "an empty doc should be 1 min");
    });
    await check("table of contents: h2/h3 only, unique anchors", () => {
      const toc = tableOfContents(
        doc(h(1, "Title"), h(2, "Outcome"), h(3, "Outcome"), h(2, "Outcome 2")),
      );
      const anchors = toc.map((t) => t.anchor).join(",");
      assert(toc.length === 3, `expected 3 entries, got ${toc.length}`);
      assert(anchors === "outcome,outcome-2,outcome-2-2", anchors);
    });
    await check("plain text keeps block breaks", () => {
      assert(plainText(doc(p("one"), p("two"))) === "one\ntwo", "block break");
    });
    await check("text becomes an editor document, and comes back", () => {
      const text = [
        "## A heading",
        "",
        "A paragraph with **bold**, *italic*, `code` and a [link](https://example.com).",
        "",
        "- one",
        "- two",
        "",
        "1. first",
        "2. second",
        "",
        "> A highlighted note.",
      ].join("\n");
      const document = textToDoc(text);
      assert(document !== null, "a document was made");
      const types = (document!.content ?? []).map((n) => n.type).join(",");
      assert(
        types === "heading,paragraph,bulletList,orderedList,callout",
        types,
      );
      assert(docToText(document) === text, docToText(document));
      assert(textToDoc("   ") === null, "whitespace is nothing");
    });
    await check("a stored document keeps only what it may", () => {
      const cleaned = sanitizeDoc({
        type: "doc",
        content: [
          { type: "script", content: [{ type: "text", text: "alert(1)" }] },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "click",
                marks: [
                  { type: "link", attrs: { href: "javascript:alert(1)" } },
                  { type: "bold" },
                  { type: "highlight" },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 9 },
            content: [{ type: "text", text: "H" }],
          },
        ],
      });
      const kinds = (cleaned?.content ?? []).map((n) => n.type).join(",");
      assert(kinds === "paragraph,heading", kinds);
      const marks = cleaned?.content?.[0]?.content?.[0]?.marks ?? [];
      assert(
        marks.length === 1 && marks[0].type === "bold",
        JSON.stringify(marks),
      );
      assert(
        cleaned?.content?.[1]?.attrs?.level === 2,
        "an unknown level becomes a heading",
      );
      assert(
        sanitizeDoc({ type: "doc", content: [{ type: "paragraph" }] }) === null,
        "empty is null",
      );
    });
    await check("password hash verifies, rejects wrong and short", async () => {
      const hash = await hashPassword("correct horse battery");
      assert(hash.startsWith("scrypt$"), "self-describing format");
      assert(await verifyPassword("correct horse battery", hash), "right");
      assert(!(await verifyPassword("wrong horse battery", hash)), "wrong");
      await rejectsWith(() => hashPassword("short"), "at least 12");
    });

    console.log("\nprojects");
    await check("a draft saves with only a title; slug generated", async () => {
      const a = await Project.create({ title: "Mobile Money Tracker" });
      assert(a.slug === "mobile-money-tracker", a.slug);
      assert(a.state === "draft", a.state);
    });
    await check("a second project with the same title gets -2", async () => {
      const b = await Project.create({ title: "Mobile Money Tracker" });
      assert(b.slug === "mobile-money-tracker-2", b.slug);
    });
    await check(
      "a typed slug that collides is refused, not renumbered",
      async () => {
        await rejects(
          () =>
            Project.create({ title: "Other", slug: "mobile-money-tracker" }),
          ["slug"],
        );
      },
    );
    await check("new projects go to the top of the manual order", async () => {
      const first = await Project.findOne().sort({ position: 1 });
      assert(first?.title === "Mobile Money Tracker", "newest first");
    });
    await check(
      "publishing an incomplete project names every gap",
      async () => {
        const draft = await Project.create({ title: "Half written" });
        draft.state = "published";
        await rejects(
          () => draft.save(),
          [
            "client",
            "year",
            "type",
            "status",
            "summary",
            "coverImage",
            "problem",
            "body",
            "stack",
          ],
        );
        const reloaded = await Project.findById(draft._id);
        assert(reloaded?.state === "draft", "still a draft in the database");
      },
    );
    await check(
      "a complete project publishes and gets publishedAt",
      async () => {
        const done = await Project.create({
          title: "Complete",
          client: "Heelan Home Health Care",
          year: 2026,
          type: "web-app",
          status: "live",
          summary: "A one-line summary.",
          coverImage: fileId,
          problem: "The problem.",
          body: doc(p("What I built.")),
          stack: ["Next.js"],
        });
        done.state = "published";
        await done.save();
        assert(done.publishedAt instanceof Date, "publishedAt set");
      },
    );
    await check("the summary is capped at 120 characters", async () => {
      await rejects(
        () => Project.create({ title: "Long", summary: "x".repeat(121) }),
        ["summary"],
      );
    });
    await check("a draft cannot be featured", async () => {
      const draft = await Project.create({ title: "Not published yet" });
      draft.featured = true;
      await rejects(() => draft.save(), ["featured"]);
    });
    await check("at most three featured projects", async () => {
      for (const t of ["F1", "F2", "F3"]) {
        const project = new Project({
          ...complete(t, fileId),
          state: "published",
          featured: true,
        });
        await project.save();
      }
      const fourth = new Project({
        ...complete("F4", fileId),
        state: "published",
        featured: true,
      });
      await rejects(() => fourth.save(), ["featured"]);
    });
    await check("archiving a featured project frees its slot", async () => {
      const f1 = await Project.findOne({ title: "F1" });
      f1!.state = "archived";
      await f1!.save();
      assert(f1!.featured === false, "unfeatured on archive");
      const fourth = new Project({
        ...complete("F4", fileId),
        state: "published",
        featured: true,
      });
      await fourth.save();
      assert(fourth.featured === true, "the freed slot is usable");
    });
    await check("unpublishing takes a project off the home page", async () => {
      const f2 = await Project.findOne({ title: "F2" });
      f2!.state = "draft";
      await f2!.save();
      assert(f2!.featured === false, "unfeatured when unpublished");
    });
    await check("updateOne cannot publish around the rules", async () => {
      await rejectsWith(
        () =>
          Project.updateOne({ title: "Half written" }, { state: "published" }),
        "save()",
      );
      await rejectsWith(
        () =>
          Project.findOneAndUpdate(
            { title: "F3" },
            { $set: { featured: false, body: {} } },
          ),
        "save()",
      );
    });
    await check("insertMany cannot create published documents", async () => {
      await rejectsWith(
        () =>
          Project.insertMany([
            { title: "Sneaky", state: "published", position: 9 },
          ]),
        "insertMany",
      );
    });

    await check(
      "the files a project uses are recorded, and released",
      async () => {
        const cover = await StoredFile.create({
          filename: "cover-in-use.png",
          originalName: "cover.png",
          mimeType: "image/png",
          size: 2048,
          width: 1200,
          height: 630,
          url: "/uploads/cover-in-use.png",
        });
        const other = await StoredFile.create({
          filename: "cover-two.png",
          originalName: "cover.png",
          mimeType: "image/png",
          size: 2048,
          width: 1200,
          height: 630,
          url: "/uploads/cover-two.png",
        });

        const project = await Project.create({
          title: "Uses a file",
          coverImage: cover._id,
        });
        const used = await StoredFile.findById(cover._id);
        assert(
          used?.usedBy.some(
            (u) =>
              u.model === "Project" && String(u.id) === String(project._id),
          ),
          "the cover is marked in use",
        );
        await rejectsWith(() => used!.deleteOne(), "still used by");

        project.coverImage = other._id;
        await project.save();
        const released = await StoredFile.findById(cover._id);
        assert(released?.usedBy.length === 0, "released when swapped out");
        await released!.deleteOne();
      },
    );

    console.log("\nposts");
    await check(
      "reading time, contents and plain text computed on save",
      async () => {
        const words = Array.from({ length: 610 }, () => "word").join(" ");
        const post = await Post.create({
          title: "Mobile money",
          body: doc(h(2, "Why"), p(words), h(3, "How")),
        });
        assert(post.readingTime === 4, `reading time ${post.readingTime}`);
        assert(post.toc.length === 2 && post.toc[0].anchor === "why", "toc");
        assert(post.bodyText?.startsWith("Why"), "bodyText");
      },
    );
    await check("contents recompute when the body changes", async () => {
      const post = await Post.findOne({ title: "Mobile money" });
      post!.body = doc(h(2, "Only"), p("short"));
      await post!.save();
      assert(post!.toc.length === 1 && post!.readingTime === 1, "recomputed");
    });
    await check(
      "publishing a post requires excerpt, cover, category, body",
      async () => {
        const draft = await Post.create({ title: "Draft post" });
        draft.state = "published";
        await rejects(
          () => draft.save(),
          ["excerpt", "coverImage", "category", "body"],
        );
      },
    );
    await check("the excerpt is capped at 160 characters", async () => {
      await rejects(
        () => Post.create({ title: "E", excerpt: "x".repeat(161) }),
        ["excerpt"],
      );
    });
    await check(
      "scheduling needs a complete post and a future time",
      async () => {
        const draft = await Post.create({ title: "Scheduled" });
        draft.scheduledFor = new Date(Date.now() + 86_400_000);
        await rejects(
          () => draft.save(),
          ["excerpt", "coverImage", "category", "body"],
        );
        const ready = await Post.create({
          title: "Ready",
          excerpt: "An excerpt.",
          coverImage: fileId,
          category: "business",
          body: doc(p("Content.")),
        });
        ready.scheduledFor = new Date(Date.now() - 60_000);
        await rejects(() => ready.save(), ["scheduledFor"]);
      },
    );
    await check("at most one featured post", async () => {
      await Post.create({ title: "Featured one", featured: true });
      await rejects(
        () => Post.create({ title: "Featured two", featured: true }),
        ["featured"],
      );
    });

    console.log("\ntestimonials");
    await check("consent must be given", async () => {
      await rejects(
        () =>
          Testimonial.create({
            name: "A",
            email: "a@example.com",
            quote: "Good.",
            consent: false,
          }),
        ["consent"],
      );
    });
    await check(
      "a submission starts pending, and email is never selected",
      async () => {
        const t = await Testimonial.create({
          name: "Amina",
          email: "amina@example.com",
          quote: "Good.",
          consent: true,
          submittedIp: "10.0.0.1",
        });
        assert(t.status === "pending", t.status);
        const loaded = await Testimonial.findById(t._id).lean();
        assert(!("email" in loaded!), "email not loaded by default");
        assert(!("submittedIp" in loaded!), "ip not loaded by default");
        const admin = await Testimonial.findById(t._id).select("+email").lean();
        assert(admin?.email === "amina@example.com", "loadable when asked for");
      },
    );
    await check(
      "cannot feature before publishing; publishing sets publishedAt",
      async () => {
        const t = await Testimonial.findOne({ name: "Amina" });
        t!.featured = true;
        await rejects(() => t!.save(), ["featured"]);
        t!.featured = false;
        t!.status = "published";
        await t!.save();
        assert(t!.publishedAt instanceof Date, "publishedAt");
        assert(typeof t!.position === "number", "given a position");
      },
    );
    await check("the quote is capped at 600 characters", async () => {
      await rejects(
        () =>
          Testimonial.create({
            name: "B",
            email: "b@example.com",
            quote: "x".repeat(601),
            consent: true,
          }),
        ["quote"],
      );
    });

    console.log("\nmembers");
    await check("an unguessable unsubscribe token is generated", async () => {
      const m = await Member.create({
        firstName: "Ali",
        email: "ALI@Example.com ",
      });
      assert(m.email === "ali@example.com", "email normalised");
      assert(m.unsubToken.length >= 40, "token length");
    });
    await check(
      "a duplicate email reads as a sentence, not E11000",
      async () => {
        await rejectsWith(
          () => Member.create({ firstName: "Ali", email: "ali@example.com" }),
          "already a member",
        );
      },
    );
    await check(
      "unsubscribing sets status and the date, never deletes",
      async () => {
        const m = await Member.findOne({ email: "ali@example.com" });
        m!.status = "unsubscribed";
        await m!.save();
        assert(m!.unsubscribedAt instanceof Date, "date set");
        assert(
          await Member.exists({ email: "ali@example.com" }),
          "still there",
        );
      },
    );

    console.log("\nfiles");
    const base = {
      originalName: "cover.png",
      mimeType: "image/png" as const,
      size: 1024,
      url: "/u/x.png",
    };
    await check("a file in use cannot be deleted by any route", async () => {
      const f = await StoredFile.create({
        ...base,
        filename: "in-use.webp",
        usedBy: [{ model: "Post", id: new mongoose.Types.ObjectId() }],
      });
      await rejectsWith(() => f.deleteOne(), "still used by");
      await rejectsWith(
        () => StoredFile.deleteOne({ _id: f._id }),
        "still used by",
      );
      await rejectsWith(() => StoredFile.deleteMany({}), "still used by");
      await rejectsWith(
        () => StoredFile.findOneAndDelete({ _id: f._id }),
        "still used by",
      );
      assert(await StoredFile.exists({ _id: f._id }), "still exists");
    });
    await check("an unused file deletes", async () => {
      const f = await StoredFile.create({ ...base, filename: "unused.webp" });
      await f.deleteOne();
      assert(!(await StoredFile.exists({ _id: f._id })), "deleted");
    });
    await check("type and size are checked", async () => {
      await rejects(
        () =>
          StoredFile.create({
            ...base,
            filename: "a.exe",
            /* deliberately invalid — the model, not TypeScript, must refuse it */
            mimeType: "application/x-msdownload" as never,
          }),
        ["mimeType"],
      );
      await rejects(
        () =>
          StoredFile.create({
            ...base,
            filename: "big.png",
            size: 10 * 1024 * 1024 + 1,
          }),
        ["size"],
      );
    });

    console.log("\nsettings, users, mail");
    const badges: ISettings["heroBadges"] = [
      { label: "A", value: "a", tone: "warning" },
      { label: "B", value: "b", tone: "success" },
      { label: "C", value: "c", tone: "accent" },
    ];
    await check("the hero needs exactly three badges", async () => {
      await rejects(
        () => Settings.create({ heroBadges: badges.slice(0, 2) }),
        ["heroBadges"],
      );
    });
    await check("there is only one settings document", async () => {
      await Settings.create({ heroBadges: badges });
      await rejectsWith(
        () => Settings.create({ heroBadges: badges }),
        "only one settings",
      );
    });
    await check(
      "there is only one admin, and the hash is never selected",
      async () => {
        const admin = new User({ email: "admin@example.com" });
        await admin.setPassword("a long enough password");
        await admin.save();
        const second = new User({ email: "second@example.com" });
        await second.setPassword("another long password");
        await rejects(() => second.save(), ["email"]);
        const loaded = await User.findOne().lean();
        assert(!("passwordHash" in loaded!), "hash not loaded by default");
        const withHash = await User.findOne().select("+passwordHash");
        assert(
          await withHash!.checkPassword("a long enough password"),
          "login works",
        );
      },
    );
    await check("a broadcast send must name its broadcast", async () => {
      await rejects(
        () =>
          MailLog.create({
            type: "broadcast",
            to: "a@example.com",
            subject: "S",
          }),
        ["broadcast"],
      );
      const log = await MailLog.create({
        type: "test",
        to: "a@example.com",
        subject: "S",
        status: "sent",
      });
      assert(log.sentAt instanceof Date, "sentAt set when sent");
    });
    await check(
      "a broadcast cannot be scheduled empty or in the past",
      async () => {
        const b = await Broadcast.create({ subject: "Update" });
        b.state = "scheduled";
        b.scheduledFor = new Date(Date.now() - 1000);
        await rejects(() => b.save(), ["body", "scheduledFor"]);
      },
    );
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log(`\nDropped ${dbName}.`);
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exitCode = 1;
}

main().catch(async (error: unknown) => {
  console.error(`\nCheck run failed: ${(error as Error).message}\n`);
  process.exitCode = 1;
  await mongoose.disconnect();
});
