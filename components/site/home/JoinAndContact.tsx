import { IconTile, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { MailGlyph, PhoneGlyph, PinGlyph } from "@/components/site/icons";
import { contact, membership } from "@/lib/content/home";
import { ContactForm, MembershipForm } from "./forms";

/* ======================================================================
   12 Membership — the ink band. The second and last use of ink on the
   home page, which docs/02-DESIGN-SYSTEM.md limits to two.
   ====================================================================== */

export function Membership() {
  return (
    <Section tone="ink" pad="ink-band" aria-labelledby="membership-heading">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-15">
        {/* Composed rather than a SectionHeading: design/01-home draws this
            heading at 36px with a line break and no accent phrase — the one
            section that departs from the eyebrow-and-accent pattern. */}
        <div className="flex flex-col gap-4">
          <span className="font-mono text-mono-label text-blue-light uppercase">
            <span aria-hidden="true">{"// "}</span>
            Membership
          </span>
          <h2
            id="membership-heading"
            className="text-h1-sm text-white lg:text-h1-band"
          >
            Be the first to see
            <br />
            what I build next
          </h2>
          <p className="max-w-sub-ink text-body text-on-ink-body">
            {membership.paragraph}
          </p>
        </div>

        <Reveal>
          <MembershipForm />
        </Reveal>
      </div>
    </Section>
  );
}

/* ======================================================================
   13 Contact — white.
   ====================================================================== */

export function Contact() {
  return (
    <Section tone="white" id="contact" aria-labelledby="contact-heading">
      <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-15">
        <div className="flex flex-col gap-4.25">
          <SectionHeading
            eyebrow="Stay connected"
            heading="Let's work"
            accent="together"
            id="contact-heading"
          />
          <p className="text-body leading-loose text-ink-body">
            {contact.paragraph}
          </p>

          <ul className="flex flex-col gap-3.75 pt-3">
            <ContactRow icon={<PhoneGlyph />} label="Phone">
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                  className="transition-button hover:text-blue"
                >
                  {contact.phone}
                </a>
              ) : (
                /* Rule 10 — bracketed until Garsame supplies it. */
                "[ YOUR NUMBER ]"
              )}
            </ContactRow>
            <ContactRow icon={<MailGlyph />} label="Email">
              <a
                href={`mailto:${contact.email}`}
                className="break-all transition-button hover:text-blue"
              >
                {contact.email}
              </a>
            </ContactRow>
            <ContactRow icon={<PinGlyph />} label="Based in">
              {contact.location}
            </ContactRow>
          </ul>
        </div>

        <Reveal>
          <ContactForm />
        </Reveal>
      </div>
    </Section>
  );
}

function ContactRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3.5">
      <IconTile size="lg">{icon}</IconTile>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-mono text-mono-meta font-regular tracking-wide text-muted uppercase">
          {label}
        </span>
        <span className="text-body font-semibold text-ink">{children}</span>
      </div>
    </li>
  );
}
