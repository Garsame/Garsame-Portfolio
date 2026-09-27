import { Card, IconTile, SectionHeading } from "@/components/ui";
import { Reveal, RevealItem } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { ServiceGlyph } from "@/components/site/icons";
import { promises, services as defaultServices } from "@/lib/content/home";
import type { PublicSiteSettings } from "@/lib/settings";

/* ======================================================================
   02 Promise band — the blue band. docs/03-PAGES.md.
   ====================================================================== */

export function PromiseBand() {
  return (
    <Section tone="blue" pad="band">
      <Reveal className="grid gap-8 lg:grid-cols-3 lg:gap-11">
        {promises.map((item, i) => (
          <RevealItem key={item.title} className="flex flex-col gap-2.75">
            <span
              aria-hidden="true"
              className="font-mono text-mono-meta font-regular tracking-wide text-on-blue-muted"
            >
              {`/ ${String(i + 1).padStart(3, "0")}`}
            </span>
            <h2 className="text-h4 text-white">{item.title}</h2>
            <p className="text-small leading-cozy text-on-blue-body">
              {item.body}
            </p>
          </RevealItem>
        ))}
      </Reveal>
    </Section>
  );
}

/* ======================================================================
   03 Services — tint. docs/03-PAGES.md.
   ====================================================================== */

const DEFAULT_SERVICES: PublicSiteSettings["services"] =
  defaultServices.map((s, i) => ({
    ...s,
    order: i + 1,
  }));

export function Services({
  services = DEFAULT_SERVICES,
}: {
  services?: PublicSiteSettings["services"];
}) {
  return (
    <Section tone="tint" aria-labelledby="services-heading">
      <SectionHeading
        align="center"
        eyebrow="What I do for you"
        heading="How can I help your"
        accent="business"
        sub="You tell me what is slow, confusing or costing you money. I build the thing that fixes it."
        className="mb-12"
        id="services-heading"
      />

      <Reveal className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => (
          <RevealItem key={service.title}>
            <Card className="h-full gap-3.25 px-6.5 pt-7.5 pb-8">
              <div className="flex items-center justify-between">
                <IconTile>
                  <ServiceGlyph icon={service.icon} />
                </IconTile>
                <span
                  aria-hidden="true"
                  className="font-mono text-mono-meta font-regular tracking-none text-faint"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-h4 text-ink">{service.title}</h3>
              <p className="text-small leading-cozy text-ink-body">
                {service.description}
              </p>
            </Card>
          </RevealItem>
        ))}
      </Reveal>
    </Section>
  );
}
