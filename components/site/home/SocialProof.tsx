import { Button, Minus, Plus, SectionHeading } from "@/components/ui";
import { PostCard, PostCardPlaceholder } from "@/components/site/PostCard";
import { Reveal, RevealItem } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import {
  TestimonialCard,
  YourTurnCard,
  type TestimonialCardData,
} from "@/components/site/TestimonialCard";
import {
  clients as defaultClients,
  faq as defaultFaq,
  featuredTestimonials as fallbackFeaturedTestimonials,
} from "@/lib/content/home";
import type { BlogPostSummaryView } from "@/lib/blog";
import type { PublicSiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

/* ======================================================================
   08 Working with — tint. Real names only, from Settings (Phase 9).
   ====================================================================== */

export function WorkingWith({
  clients = defaultClients,
}: {
  clients?: string[];
}) {
  return (
    <Section
      tone="tint"
      pad="band-sm"
      aria-labelledby="clients-heading"
      innerClassName="flex flex-col items-center gap-6"
    >
      <h2
        id="clients-heading"
        className="font-mono text-mono-label text-muted uppercase"
      >
        <span aria-hidden="true">{"// "}</span>
        Working with
      </h2>
      <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-center">
        {clients.map((client) => (
          <li key={client} className="text-client text-muted-strong">
            {client}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ======================================================================
   09 Testimonials — white.
   ====================================================================== */

const yourTurnSpan = ["lg:col-span-3", "lg:col-span-2", ""] as const;

export function Testimonials({
  testimonials,
}: {
  testimonials?: TestimonialCardData[];
}) {
  const list =
    testimonials && testimonials.length > 0
      ? testimonials
      : fallbackFeaturedTestimonials;
  const shown = list.slice(0, 2);

  return (
    <Section tone="white" aria-labelledby="testimonials-heading">
      <div className="mb-10.5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <SectionHeading
          eyebrow="In their words"
          heading="What the people I built for"
          accent="say"
          id="testimonials-heading"
        />
        <div className="shrink-0">
          <Button
            href="/testimonials#submit"
            size="sm"
            icon={<Plus size={14} />}
          >
            Write a testimonial
          </Button>
        </div>
      </div>

      <Reveal className="grid gap-5 lg:grid-cols-3">
        {shown.map((t) => (
          <RevealItem key={`${t.name}-${t.quote.slice(0, 24)}`}>
            <TestimonialCard testimonial={t} />
          </RevealItem>
        ))}
        <RevealItem className={cn(yourTurnSpan[shown.length])}>
          <YourTurnCard wide={shown.length === 0} />
        </RevealItem>
      </Reveal>
    </Section>
  );
}

/* ======================================================================
   10 FAQ — tint. Accordion, first item open, blue border on the open item.
   ====================================================================== */

const DEFAULT_FAQ: PublicSiteSettings["faq"] = defaultFaq.items.map((f, i) => ({
  question: f.question,
  answer: f.answer || undefined,
  order: i + 1,
}));

export function Faq({
  faqItems = DEFAULT_FAQ,
}: {
  faqItems?: PublicSiteSettings["faq"];
}) {
  return (
    <Section tone="tint" aria-labelledby="faq-heading">
      <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-15">
        <div className="flex flex-col gap-4.25">
          <SectionHeading
            eyebrow="Questions"
            heading="Before you"
            accent="get in touch"
            id="faq-heading"
          />
          <p className="text-body leading-loose text-ink-body">{defaultFaq.sub}</p>
        </div>

        <div className="flex flex-col gap-2.75">
          {faqItems.map((item, i) => (
            <details
              key={`${item.question}-${i}`}
              name="faq"
              open={i === 0}
              className="group rounded-card border border-border bg-white transition-card open:border-blue"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-6 py-5 group-open:pt-5.5 group-open:pb-3 [&::-webkit-details-marker]:hidden">
                <span className="text-body-lg font-semibold text-ink group-open:font-bold group-open:text-blue">
                  {item.question}
                </span>
                <Plus className="shrink-0 text-muted group-open:hidden" />
                <Minus className="hidden shrink-0 text-blue group-open:block" />
              </summary>

              <div className="px-6 pb-5.5 text-small leading-relaxed text-ink-body">
                {item.answer ? (
                  item.answer
                ) : (
                  <span className="font-mono text-mono-meta font-regular text-muted">
                    [ NEEDS AN ANSWER — written in Settings ]
                  </span>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ======================================================================
   11 Latest from the blog — white.
   ====================================================================== */

export function LatestPosts({
  posts = [],
}: {
  posts?: BlogPostSummaryView[];
}) {
  return (
    <Section tone="white" aria-labelledby="blog-heading">
      <div className="mb-10.5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
        <SectionHeading
          eyebrow="Writing"
          heading="Notes from the"
          accent="field"
          id="blog-heading"
        />
        <div className="shrink-0">
          <Button href="/blog" variant="secondary" size="sm" withArrow>
            Read the blog
          </Button>
        </div>
      </div>

      <Reveal className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.length > 0
          ? posts.map((post, i) => (
              <RevealItem key={post.slug}>
                <PostCard post={post} index={i} />
              </RevealItem>
            ))
          : [0, 1, 2].map((i) => (
              <RevealItem key={i}>
                <PostCardPlaceholder index={i} />
              </RevealItem>
            ))}
      </Reveal>
    </Section>
  );
}
