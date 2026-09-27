import type { Metadata } from "next";
import { Button } from "@/components/ui";
import { Reveal, RevealItem } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "What this site collects, why, how long it is kept, that it is never sold or shared, and how to ask for deletion.",
};

export default function PrivacyPage() {
  return (
    <>
      {/* ----------------------------------------------------------- 01 Hero */}
      <Section tone="gradient" pad="hero">
        <div className="flex max-w-[720px] flex-col items-start gap-4.5">
          <span className="font-mono text-mono-label uppercase tracking-widest text-blue">
            {"// Privacy notice"}
          </span>
          <h1 className="text-display font-extrabold tracking-tight text-ink lg:text-[48px] lg:leading-[1.14]">
            Short, plain, and <span className="text-blue">honest</span>
          </h1>
          <p className="text-body-large leading-[1.75] text-ink-body">
            This site collects the minimum information needed to answer an
            enquiry, send updates you requested, or publish a testimonial you
            submitted. It does not track you across the web.
          </p>
        </div>
      </Section>

      {/* -------------------------------------------------------- 02 Notice */}
      <Section tone="white">
        <Reveal className="mx-auto flex max-w-[680px] flex-col gap-10">
          <RevealItem className="flex flex-col gap-3">
            <h2 className="text-h2 font-bold tracking-tight text-ink">
              1. What I collect
            </h2>
            <p className="text-body-large leading-[1.8] text-ink-3">
              I only collect personal details you choose to give me directly
              through the forms on this site:
            </p>
            <ul className="flex list-disc flex-col gap-2 pl-6 text-body leading-[1.75] text-ink-body">
              <li>
                <strong className="text-ink">Contact form:</strong> your name,
                email address, business name, and whatever you write in the
                message.
              </li>
              <li>
                <strong className="text-ink">Membership:</strong> your first
                name, last name, and email address.
              </li>
              <li>
                <strong className="text-ink">Testimonials:</strong> your name,
                role, company, private verification email, quote, and optional
                photo.
              </li>
            </ul>
          </RevealItem>

          <RevealItem className="flex flex-col gap-3">
            <h2 className="text-h2 font-bold tracking-tight text-ink">
              2. Why it is collected
            </h2>
            <p className="text-body-large leading-[1.8] text-ink-3">
              To answer your question, to send you the updates you asked for, or
              to credit your words on the testimonials page. That is all.
            </p>
          </RevealItem>

          <RevealItem className="flex flex-col gap-3">
            <h2 className="text-h2 font-bold tracking-tight text-ink">
              3. No tracking cookies or third-party scripts
            </h2>
            <p className="text-body-large leading-[1.8] text-ink-3">
              There are no third-party analytics scripts, no advertising trackers,
              and no marketing pixels on this website. Basic page visit counts
              are recorded anonymously on this server without recording your IP
              address or fingerprinting your device.
            </p>
          </RevealItem>

          <RevealItem className="flex flex-col gap-3">
            <h2 className="text-h2 font-bold tracking-tight text-ink">
              4. Never sold or shared
            </h2>
            <p className="text-body-large leading-[1.8] text-ink-3">
              Your details will never be sold, rented, or shared with third
              parties. Your information stays on a private database operated by
              Garsame Mohamud.
            </p>
          </RevealItem>

          <RevealItem className="flex flex-col gap-3">
            <h2 className="text-h2 font-bold tracking-tight text-ink">
              5. How to leave or delete your data
            </h2>
            <p className="text-body-large leading-[1.8] text-ink-3">
              Every membership email carries a one-click unsubscribe link. If
              you ever want your contact messages or submitted data completely
              removed from the database, send an email to{" "}
              <a
                href="mailto:contact@garsame.com"
                className="font-semibold text-blue hover:underline"
              >
                contact@garsame.com
              </a>{" "}
              and it will be deleted within 48 hours.
            </p>
          </RevealItem>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------------- 03 CTA */}
      <Section tone="blue" pad="band">
        <Reveal className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center md:gap-12">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-h2 font-extrabold tracking-tight text-white lg:text-[30px]">
              Have a question about your privacy?
            </h2>
            <p className="text-body text-[#C9D2FB]">
              Feel free to reach out anytime.
            </p>
          </div>
          <div className="shrink-0">
            <Button href="/contact" variant="inverse" withArrow>
              Get in Touch
            </Button>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
