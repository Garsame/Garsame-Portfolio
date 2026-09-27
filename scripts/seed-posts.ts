import type { Types } from "mongoose";
import { textToDoc } from "../lib/editor-text";
import type { PostCategory } from "../lib/blog-rules";
import { Post, StoredFile } from "../models";

type Log = (line: string) => void;

export async function seedPosts(log: Log = console.log) {
  // Create placeholder cover file if not exists
  let placeholderCover = await StoredFile.findOne({ filename: "placeholder-blog-cover.svg" });
  if (!placeholderCover) {
    placeholderCover = await StoredFile.create({
      filename: "placeholder-blog-cover.svg",
      originalName: "placeholder-blog-cover.svg",
      mimeType: "image/svg+xml",
      size: 1024,
      width: 1200,
      height: 630,
      url: "/placeholders/somali-notes-ai.svg",
      alt: "Blog cover placeholder",
      usedBy: [],
    });
  }

  const postsData: {
    title: string;
    slug: string;
    category: PostCategory;
    featured: boolean;
    excerpt: string;
    coverImage: Types.ObjectId;
    publishedAt: Date;
    views: number;
    bodyTextRaw: string;
  }[] = [
    {
      title: "What every Somali business should ask before buying software",
      slug: "what-every-somali-business-should-ask-before-buying-software",
      category: "technology",
      featured: true,
      excerpt:
        "Five questions that separate a system you will still be using next year from one that sits unopened on a laptop in the back office.",
      coverImage: placeholderCover._id as Types.ObjectId,
      publishedAt: new Date("2026-09-12T10:00:00Z"),
      views: 842,
      bodyTextRaw: `Most business owners I meet have already been sold software once, and it did not work. Not because the developer was dishonest — usually because nobody asked the five questions below before any money changed hands.

A system is not a product you buy off a shelf. It is a relationship with a person, running on a machine, for years. These questions tell you what kind of relationship you are about to enter.

## Who actually uses it?

Not who buys it. Who opens it at seven in the morning with one hand while holding a delivery note in the other. If the person who will actually use the system has not been in the room, the system is being designed for a meeting rather than for a job.

> Ask to have your counter staff in the first conversation. A developer who resists that is designing for you, not for your business.

In one health care project we removed a feature the whole team loved, because the nurse who would have used it had a phone that lost signal for twenty minutes at a time.

## What happens when it breaks?

It will break. Everything does. The question is what your Tuesday looks like when it does — whether there is a person who answers, how quickly, and whether the fix costs you extra.

A good answer sounds like: "Call me. Small fixes are in the monthly plan. Anything bigger, I quote it first and you decide."

## Who owns the data?

You should own the code, the database, the server, and the exports. If you decide to stop working with your engineer tomorrow, you should be able to hand the keys to another developer in two hours.

## What does month two cost?

Ask about hosting, backups, domain renewals, SMS fees, and maintenance before committing. The initial build is only the start of the software lifecycle.

## Can I see one that is running?

Ask to see a system that has survived at least six months of real use in Somalia. Real operations reveal the truth about software reliability.`,
    },
    {
      title: "Mobile money is changing how shops in Mogadishu get paid",
      slug: "mobile-money-is-changing-how-shops-in-mogadishu-get-paid",
      category: "business",
      featured: false,
      excerpt:
        "What the shift away from cash means for record keeping, theft, and actually knowing what you earned.",
      coverImage: placeholderCover._id as Types.ObjectId,
      publishedAt: new Date("2026-08-29T10:00:00Z"),
      views: 1204,
      bodyTextRaw: `Walking through Bakara market today, almost no physical cash changes hands for everyday retail. Everything flows through EVC Plus, e-Dahab, and merchant mobile wallets.

## The disappearance of physical registers

When transactions are entirely digital, the traditional cash register becomes redundant. However, many shops still reconcile payments manually by reading SMS messages off a shared Nokia handset.

> Reconciling mobile payments by reading SMS messages manually is where modern retail operations lose hundreds of hours.

## Automated payment verification

By integrating direct merchant API callbacks, a system can verify payments immediately on the server before printing a receipt or releasing stock. This completely eliminates forged payment screenshots and manual verification bottlenecks.

## Real daily reporting

With verified digital payments, business owners gain real-time visibility into sales volume, peak hours, and inventory turnover without waiting for end-of-month manual tallying.`,
    },
    {
      title: "Can AI understand Somali well enough to be useful yet?",
      slug: "can-ai-understand-somali-well-enough-to-be-useful-yet",
      category: "ai",
      featured: false,
      excerpt:
        "What I found testing transcription and translation on real lectures, and where it still fails badly.",
      coverImage: placeholderCover._id as Types.ObjectId,
      publishedAt: new Date("2026-08-14T10:00:00Z"),
      views: 967,
      bodyTextRaw: `During my final year research at Hormuud University, I spent months evaluating modern AI models on spoken and written Somali.

## The current state of Somali NLP

Most large foundation models have seen very little high-quality Somali training data compared to English or Arabic. While standard grammar is reasonably parsed, colloquial Mogadishu dialect and technical academic terms frequently produce hallucinations.

## Audio transcription challenges

Background noise, room echo, and dialectal variations significantly impact word error rates (WER). We found that preprocessing audio and fine-tuning acoustic models produced a 40% accuracy improvement on real university lecture recordings.

> AI can already summarize structured Somali text effectively, but raw transcription still requires human review in critical domains like health care and legal records.

## Practical takeaways for local builders

Focus AI implementations on assistant tasks — draft summarization, document classification, and search indexing — rather than fully autonomous decisions.`,
    },
  ];

  for (const p of postsData) {
    const existing = await Post.findOne({ slug: p.slug });
    const doc = textToDoc(p.bodyTextRaw);

    if (existing) {
      existing.title = p.title;
      existing.category = p.category;
      existing.featured = p.featured;
      existing.excerpt = p.excerpt;
      existing.coverImage = p.coverImage;
      existing.body = doc;
      existing.state = "published";
      existing.publishedAt = p.publishedAt;
      existing.views = p.views;
      await existing.save();
      log(`posts      updated "${p.title}"`);
    } else {
      await Post.create({
        title: p.title,
        slug: p.slug,
        category: p.category,
        featured: p.featured,
        excerpt: p.excerpt,
        coverImage: p.coverImage,
        body: doc,
        state: "published",
        publishedAt: p.publishedAt,
        views: p.views,
      });
      log(`posts      created "${p.title}"`);
    }
  }
}
