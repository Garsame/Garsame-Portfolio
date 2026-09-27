import type { Metadata } from "next";
import { Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { getSiteSettings } from "@/lib/settings";
import { generateFormTimestampToken } from "@/lib/anti-spam";
import { ContactForm } from "@/components/site/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell me what is slowing your business down. Phone, email and an enquiry form.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const timestampToken = generateFormTimestampToken();

  return (
    <div className="flex flex-col">
      <Section tone="gradient" pad="hero">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Left Column: Context & Contact Details */}
          <Reveal>
            <div className="flex flex-col gap-5">
              <span className="font-mono text-mono-eyebrow text-blue uppercase">
                {"// Stay connected"}
              </span>
              <h1 className="text-display font-extrabold tracking-tight text-ink leading-[1.14]">
                Let&apos;s work <span className="text-blue">together</span>
              </h1>
              <p className="text-body-large leading-[1.75] text-ink-body">
                Tell me what is slowing your business down. If I am the right
                person for it, I will say so and give you a price. If I am not, I
                will tell you that too — and usually point you at someone who is.
              </p>

              {/* Availability Status Card */}
              <div className="mt-1 flex items-center gap-3 rounded-card border border-border bg-white p-4.5 shadow-card">
                <span
                  className={`size-2.5 shrink-0 rounded-full ${
                    settings.availability === "available"
                      ? "bg-success"
                      : settings.availability === "limited"
                        ? "bg-warning"
                        : "bg-muted"
                  }`}
                />
                <div className="flex flex-col">
                  <span className="text-small font-bold text-ink">
                    {settings.availability === "available"
                      ? "Available for new work"
                      : settings.availability === "limited"
                        ? "Limited availability"
                        : "Currently booked"}
                  </span>
                  <span className="text-caption text-ink-body">
                    {settings.availabilityText ||
                      "Taking on projects starting from next month"}
                  </span>
                </div>
              </div>

              {/* Direct Channels */}
              <div className="flex flex-col gap-4 pt-3">
                {/* Phone & WhatsApp */}
                <div className="flex items-center gap-3.5">
                  <span className="flex size-tile shrink-0 items-center justify-center rounded-tile bg-accent-soft text-blue">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
                    </svg>
                  </span>
                  <div className="flex flex-col">
                    <span className="font-mono text-mono-meta text-muted uppercase">
                      Phone and WhatsApp
                    </span>
                    <span className="text-body font-semibold text-ink">
                      {settings.phone || "[ YOUR NUMBER ]"}
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3.5">
                  <span className="flex size-tile shrink-0 items-center justify-center rounded-tile bg-accent-soft text-blue">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                  </span>
                  <div className="flex flex-col">
                    <span className="font-mono text-mono-meta text-muted uppercase">
                      Email
                    </span>
                    <a
                      href={`mailto:${settings.email || "garsame40@gmail.com"}`}
                      className="text-body font-semibold text-ink hover:text-blue hover:underline"
                    >
                      {settings.email || "garsame40@gmail.com"}
                    </a>
                  </div>
                </div>

                {/* Based in */}
                <div className="flex items-center gap-3.5">
                  <span className="flex size-tile shrink-0 items-center justify-center rounded-tile bg-accent-soft text-blue">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <div className="flex flex-col">
                    <span className="font-mono text-mono-meta text-muted uppercase">
                      Based in
                    </span>
                    <span className="text-body font-semibold text-ink">
                      {settings.location || "Mogadishu, Somalia"}
                    </span>
                  </div>
                </div>

                {/* Reply time */}
                <div className="flex items-center gap-3.5">
                  <span className="flex size-tile shrink-0 items-center justify-center rounded-tile bg-accent-soft text-blue">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  </span>
                  <div className="flex flex-col">
                    <span className="font-mono text-mono-meta text-muted uppercase">
                      Reply time
                    </span>
                    <span className="text-body font-semibold text-ink">
                      Within 24 hours
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right Column: Contact Form */}
          <Reveal delay={0.1}>
            <ContactForm timestampToken={timestampToken} />
          </Reveal>
        </div>
      </Section>
    </div>
  );
}
