import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { generateFormTimestampToken } from "@/lib/anti-spam";
import { MembershipJoinForm } from "@/components/site/membership/MembershipJoinForm";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Be the first to see what I build next. Free, and you can leave whenever you want.",
};

export default function MembershipPage() {
  const timestampToken = generateFormTimestampToken();

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------ 01 Hero & Form */}
      <Section tone="gradient" pad="hero">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="flex flex-col gap-5">
              <span className="font-mono text-mono-eyebrow text-blue uppercase">
                {"// Membership"}
              </span>
              <h1 className="text-display font-extrabold tracking-tight text-ink leading-[1.14]">
                Be the first to see<br />
                what I build <span className="text-blue">next</span>
              </h1>
              <p className="text-body-large leading-[1.75] text-ink-body">
                Members are a small group of people I keep close. When I finish
                a system, learn something worth passing on, or publish something
                new, they hear it before it goes anywhere else.
              </p>
              <p className="text-body-large leading-[1.75] text-ink-body">
                It is free, and it always will be. I am not building an audience
                to sell to. I am keeping a list of people who might want to know.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <MembershipJoinForm timestampToken={timestampToken} source="membership" />
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------- 02 What You Get */}
      <Section tone="tint">
        <div className="flex flex-col gap-11">
          <Reveal>
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="font-mono text-mono-eyebrow text-blue uppercase">
                {"// What you get"}
              </span>
              <h2 className="text-h2 font-extrabold tracking-tight text-ink">
                Three things, and nothing <span className="text-blue">else</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* Card 1 */}
            <Reveal delay={0.05}>
              <div className="flex h-full flex-col gap-3 rounded-card border border-border bg-white p-7.5 shadow-card">
                <span className="flex size-tile shrink-0 items-center justify-center rounded-tile bg-accent-soft text-blue">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
                  </svg>
                </span>
                <h3 className="text-[18px] font-bold text-ink leading-[1.3]">
                  New systems, before they are public
                </h3>
                <p className="text-small leading-[1.65] text-ink-body">
                  When a project goes live, members see it first — including the
                  parts I do not put on the site.
                </p>
              </div>
            </Reveal>

            {/* Card 2 */}
            <Reveal delay={0.1}>
              <div className="flex h-full flex-col gap-3 rounded-card border border-border bg-white p-7.5 shadow-card">
                <span className="flex size-tile shrink-0 items-center justify-center rounded-tile bg-accent-soft text-blue">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M4 4h16v16H4z" />
                    <path d="M8 9h8M8 13h8M8 17h5" />
                  </svg>
                </span>
                <h3 className="text-[18px] font-bold text-ink leading-[1.3]">
                  What I learned, written plainly
                </h3>
                <p className="text-small leading-[1.65] text-ink-body">
                  The decisions, the mistakes and the things that did not work.
                  Useful whether or not you ever hire me.
                </p>
              </div>
            </Reveal>

            {/* Card 3 */}
            <Reveal delay={0.15}>
              <div className="flex h-full flex-col gap-3 rounded-card border border-border bg-white p-7.5 shadow-card">
                <span className="flex size-tile shrink-0 items-center justify-center rounded-tile bg-accent-soft text-blue">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
                  </svg>
                </span>
                <h3 className="text-[18px] font-bold text-ink leading-[1.3]">
                  A direct line to me
                </h3>
                <p className="text-small leading-[1.65] text-ink-body">
                  Reply to any message and it comes straight to me. Members get
                  answered first.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------- 03 The Promise */}
      <Section tone="white">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <div className="flex flex-col gap-3.5">
              <span className="font-mono text-mono-eyebrow text-blue uppercase">
                {"// The promise"}
              </span>
              <h2 className="text-h2 font-extrabold tracking-tight text-ink leading-[1.2]">
                What I will never do<br />
                with your details
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3.5 rounded-card border border-border bg-[#F7F9FF] p-5 sm:px-6 shadow-card">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C0342B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="shrink-0"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                <span className="text-[15px] font-medium text-ink-3">
                  Sell, share or hand your email to anyone, for any reason
                </span>
              </div>

              <div className="flex items-center gap-3.5 rounded-card border border-border bg-[#F7F9FF] p-5 sm:px-6 shadow-card">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C0342B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="shrink-0"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                <span className="text-[15px] font-medium text-ink-3">
                  Send you something every week because a schedule said so
                </span>
              </div>

              <div className="flex items-center gap-3.5 rounded-card border border-border bg-[#F7F9FF] p-5 sm:px-6 shadow-card">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C0342B"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="shrink-0"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                <span className="text-[15px] font-medium text-ink-3">
                  Make leaving difficult — one click removes you, no questions
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </div>
  );
}
