import type { Metadata } from "next";
import Image from "next/image";
import { getAllPublishedTestimonials } from "@/lib/testimonials";
import { Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { generateFormTimestampToken } from "@/lib/anti-spam";
import { TestimonialSubmitForm } from "@/components/site/testimonials/TestimonialSubmitForm";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "What the people I built for say. Read the published testimonials, or write one.",
};

export default async function TestimonialsPage() {
  const published = await getAllPublishedTestimonials();
  const timestampToken = generateFormTimestampToken();

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------ 01 Hero Header */}
      <Section tone="gradient" pad="hero">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <div className="flex max-w-[680px] flex-col gap-4">
              <span className="font-mono text-mono-eyebrow text-blue uppercase">
                {"// In their words"}
              </span>
              <h1 className="text-display font-extrabold tracking-tight text-ink leading-[1.14]">
                What the people I<br />
                built for <span className="text-blue">say</span>
              </h1>
              <p className="text-body-large leading-[1.75] text-ink-body">
                Every word here was written by the person whose name is on it.
                Nothing is edited except an obvious typo, and nothing appears
                until I have read it.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <a
              href="#submit"
              className="inline-flex items-center gap-2 rounded-btn bg-blue px-6 py-3.5 text-small font-semibold text-white shadow-card transition-button hover:bg-blue-hover clip-corner-btn self-start lg:self-auto"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M8 3v10M3 8h10" />
              </svg>
              Write a testimonial
            </a>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------- Testimonials Grid */}
      <Section tone="white">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {published.length > 0 ? (
            published.map((t, idx) => (
              <Reveal key={t.id} delay={idx * 0.05}>
                <div className="flex h-full flex-col gap-4 rounded-card border border-border bg-white p-7 shadow-card">
                  {/* Quote SVG */}
                  <svg
                    width="28"
                    height="22"
                    viewBox="0 0 28 22"
                    fill="#C9D2F7"
                    className="shrink-0 text-[#C9D2F7]"
                  >
                    <path d="M0 22V11C0 4.9 4.9 0 11 0v4.4A6.6 6.6 0 0 0 4.4 11H11v11H0zm17 0V11c0-6.1 4.9-11 11-11v4.4A6.6 6.6 0 0 0 21.4 11H28v11H17z" />
                  </svg>
                  <p className="text-[15px] leading-[1.7] text-ink-3">
                    {t.quote}
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-2">
                    {t.photoUrl ? (
                      <div className="relative size-10.5 shrink-0 overflow-hidden rounded-full border border-border">
                        <Image
                          src={t.photoUrl}
                          alt={t.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="size-10.5 shrink-0 rounded-full bg-[#DDE3FA]" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-ink">
                        {t.name}
                      </span>
                      <span className="font-mono text-mono-meta text-muted">
                        {[t.role, t.business].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))
          ) : (
            <>
              {/* Placeholder Card 1 */}
              <Reveal delay={0.05}>
                <div className="flex h-full flex-col gap-4 rounded-card border border-border bg-white p-7 shadow-card">
                  <svg
                    width="28"
                    height="22"
                    viewBox="0 0 28 22"
                    fill="#C9D2F7"
                    className="shrink-0 text-[#C9D2F7]"
                  >
                    <path d="M0 22V11C0 4.9 4.9 0 11 0v4.4A6.6 6.6 0 0 0 4.4 11H11v11H0zm17 0V11c0-6.1 4.9-11 11-11v4.4A6.6 6.6 0 0 0 21.4 11H28v11H17z" />
                  </svg>
                  <p className="text-[15px] leading-[1.7] text-ink-3">
                    [ Waiting on a real quote from the Heelan team. Replace once they send it. ]
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-2">
                    <span className="size-10.5 shrink-0 rounded-full bg-[#DDE3FA]" />
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-ink">
                        [ Name ]
                      </span>
                      <span className="font-mono text-mono-meta text-muted">
                        Heelan Home Health Care
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Placeholder Card 2 */}
              <Reveal delay={0.1}>
                <div className="flex h-full flex-col gap-4 rounded-card border border-border bg-white p-7 shadow-card">
                  <svg
                    width="28"
                    height="22"
                    viewBox="0 0 28 22"
                    fill="#C9D2F7"
                    className="shrink-0 text-[#C9D2F7]"
                  >
                    <path d="M0 22V11C0 4.9 4.9 0 11 0v4.4A6.6 6.6 0 0 0 4.4 11H11v11H0zm17 0V11c0-6.1 4.9-11 11-11v4.4A6.6 6.6 0 0 0 21.4 11H28v11H17z" />
                  </svg>
                  <p className="text-[15px] leading-[1.7] text-ink-3">
                    [ Waiting on a real quote from MGH. Replace once they send it. ]
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-2">
                    <span className="size-10.5 shrink-0 rounded-full bg-[#DDE3FA]" />
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-ink">
                        [ Name ]
                      </span>
                      <span className="font-mono text-mono-meta text-muted">
                        MGH
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Placeholder Card 3 */}
              <Reveal delay={0.15}>
                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-card border border-dashed border-[#B9C6F5] bg-[#F7F9FF] p-7 text-center">
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8C9CE4"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-[16px] font-bold text-ink-3">
                    This space is for you
                  </span>
                  <p className="text-[13px] leading-[1.65] text-[#8C9CE4]">
                    Published testimonials fill this grid as they are approved.
                  </p>
                </div>
              </Reveal>
            </>
          )}
        </div>
      </Section>

      {/* ------------------------------------------- 02 Submit Form (#submit) */}
      <section id="submit" className="relative bg-ink px-6 py-20 lg:px-28">
        <div className="mx-auto max-w-container">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            {/* Left Column Reassurance */}
            <Reveal>
              <div className="flex flex-col gap-4">
                <span className="font-mono text-mono-eyebrow text-blue-light uppercase">
                  {"// Your turn"}
                </span>
                <h2 className="text-display font-extrabold tracking-tight text-white leading-[1.2]">
                  Worked with me?<br />
                  Say so here.
                </h2>
                <p className="max-w-[420px] text-[15px] leading-[1.75] text-[#96A1C4]">
                  A few honest sentences about what we built and how it went. It
                  helps the next business owner decide, and it takes three
                  minutes.
                </p>

                <div className="flex flex-col gap-3 pt-3">
                  <div className="flex items-start gap-3">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7B90FF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="mt-0.5 shrink-0"
                    >
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                    <span className="text-[14px] leading-[1.6] text-[#B3BCD8]">
                      I read every submission before it appears on the site
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7B90FF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="mt-0.5 shrink-0"
                    >
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                    <span className="text-[14px] leading-[1.6] text-[#B3BCD8]">
                      Your email stays private — it is only so I can reach you
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#7B90FF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="mt-0.5 shrink-0"
                    >
                      <path d="M4 12l5 5L20 6" />
                    </svg>
                    <span className="text-[14px] leading-[1.6] text-[#B3BCD8]">
                      Ask me to take it down at any time and it comes down
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Right Column Submission Form */}
            <Reveal delay={0.1}>
              <TestimonialSubmitForm timestampToken={timestampToken} />
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
