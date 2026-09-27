import type { Metadata } from "next";
import { Button, Card, IconTile, SectionHeading } from "@/components/ui";
import { ServiceGlyph } from "@/components/site/icons";
import { Reveal, RevealItem } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import type { ServiceIcon } from "@/lib/content/home";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Software engineering services for businesses in Somalia and East Africa: custom platforms, customer apps, reporting, automated workflows, and maintenance.",
};

type ServiceItem = {
  idx: string;
  icon: ServiceIcon;
  title: string;
  body: string;
  whatChanges: string;
};

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    idx: "01",
    icon: "screen",
    title: "One place for the whole business",
    body: "Your sales are in a notebook, your orders are in a WhatsApp group and your stock is in someone's head. I replace all of it with one system your staff open in the morning and work from all day — on a computer at the desk and on a phone anywhere else.",
    whatChanges:
      "Nothing is written twice. Nothing is lost when someone is away. You can see yesterday without asking anyone.",
  },
  {
    idx: "02",
    icon: "phone",
    title: "An app in your customers' hands",
    body: "Your customers stop calling to ask whether you are open, what the price is, or where their order is. They open your app, see it, book it and pay for it — at eleven at night if that is when they remember.",
    whatChanges:
      "Orders arrive while you sleep. Your staff answer fewer calls and do more work.",
  },
  {
    idx: "03",
    icon: "chart",
    title: "Know what is happening, daily",
    body: "One screen that tells you what sold, what is running out, who worked, and what is booked for tomorrow. Not a report someone prepares for you at the end of the month — the real position, this morning.",
    whatChanges:
      "You decide from facts instead of memory, and you notice a problem in a day rather than a quarter.",
  },
  {
    idx: "04",
    icon: "mail",
    title: "Messages and receipts send themselves",
    body: "Booking confirmations, payment receipts, appointment reminders, delivery updates and follow-ups go out on their own, in the wallet and the language your customers already use. Payment is checked on the server before anything is marked as paid.",
    whatChanges:
      "Nobody types the same message forty times a day, and no payment is taken on trust.",
  },
  {
    idx: "05",
    icon: "automation",
    title: "Let the computer do the repeated work",
    body: "Reading a stack of documents, sorting applications, writing up notes from a recording, matching one list against another. I have built this for Somali as well as English, and published research on it — so I can tell you honestly where it works and where it still does not.",
    whatChanges:
      "A task that took a morning takes a minute, and your people spend the morning on something that needs a person.",
  },
  {
    idx: "06",
    icon: "support",
    title: "Someone to call when it breaks",
    body: "A monthly plan: hosting kept running, backups taken, updates applied, small changes made, and a person who answers when something is wrong. Software is not finished on the day it is delivered, and anyone who tells you otherwise has not maintained one.",
    whatChanges:
      "A problem is a phone call, not a crisis, and the system is still working in three years.",
  },
];

const DEFAULT_PROCESS_STEPS = [
  {
    step: "STEP 01",
    title: "We talk",
    text: "I see how the work is done today, not how it is described.",
    isFirst: true,
  },
  {
    step: "STEP 02",
    title: "We agree the price",
    text: "Written, fixed, split into phases. No surprise invoice.",
    isFirst: false,
  },
  {
    step: "STEP 03",
    title: "I build",
    text: "Each phase ends with something you can open and try.",
    isFirst: false,
  },
  {
    step: "STEP 04",
    title: "You go live",
    text: "Your server, your staff trained, everything written down.",
    isFirst: false,
  },
  {
    step: "STEP 05",
    title: "I stay",
    text: "Updates, backups and fixes for as long as you want.",
    isFirst: false,
  },
];

export default async function ServicesPage() {
  const settings = await getSiteSettings();

  const servicesList: ServiceItem[] =
    settings.services.length === 6
      ? settings.services.map((s, i) => ({
          idx: String(i + 1).padStart(2, "0"),
          icon: s.icon as ServiceIcon,
          title: s.title,
          body: s.description,
          whatChanges: DEFAULT_SERVICES[i]?.whatChanges || "Clear operational impact.",
        }))
      : DEFAULT_SERVICES;

  const processSteps =
    settings.processSteps.length > 0
      ? settings.processSteps.map((p, i) => ({
          step: `STEP ${String(i + 1).padStart(2, "0")}`,
          title: p.title,
          text: p.description,
          isFirst: i === 0,
        }))
      : DEFAULT_PROCESS_STEPS;
  return (
    <>
      {/* ----------------------------------------------------------- 01 Hero */}
      <Section tone="gradient" pad="hero">
        <div className="flex max-w-[720px] flex-col items-start gap-4.5">
          <span className="font-mono text-mono-label uppercase tracking-widest text-blue">
            {"// Services"}
          </span>
          <h1 className="text-display font-extrabold tracking-tight text-ink lg:text-[48px] lg:leading-[1.14]">
            Six things I do, and
            <br />
            one I will not <span className="text-blue">pretend</span>
          </h1>
          <p className="text-body-large leading-[1.75] text-ink-body">
            Everything below is work I have delivered and can show you. If what
            you need is not here, I will say so in the first call and point you
            somewhere better.
          </p>
        </div>
      </Section>

      {/* ------------------------------------------------------- 02 Services */}
      <Section tone="tint">
        <Reveal className="flex flex-col gap-4.5">
          {servicesList.map((s) => (
            <RevealItem key={s.idx}>
              <Card className="grid grid-cols-1 items-start gap-6 p-6 sm:p-8.5 lg:grid-cols-[80px_1fr_300px] lg:gap-8">
                <div className="flex flex-row items-center gap-3 lg:flex-col lg:items-start lg:gap-3">
                  <IconTile>
                    <ServiceGlyph icon={s.icon} size={23} />
                  </IconTile>
                  <span className="font-mono text-mono-label text-faint">
                    {s.idx}
                  </span>
                </div>

                <div className="flex flex-col gap-2.75">
                  <h2 className="text-h3 font-bold tracking-tight text-ink lg:text-[24px]">
                    {s.title}
                  </h2>
                  <p className="text-body leading-[1.75] text-ink-body">
                    {s.body}
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 rounded-[10px] bg-tint-soft p-5">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-muted">
                    WHAT CHANGES
                  </span>
                  <p className="text-caption leading-[1.6] text-ink-3">
                    {s.whatChanges}
                  </p>
                </div>
              </Card>
            </RevealItem>
          ))}
        </Reveal>
      </Section>

      {/* -------------------------------------------------------- 03 Process */}
      <Section tone="white">
        <Reveal className="flex flex-col gap-11">
          <SectionHeading
            eyebrow="Process"
            heading="How we get there"
            align="center"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {processSteps.map((step) => (
              <RevealItem key={step.step}>
                <div
                  className={`flex flex-col gap-2.5 pt-4 ${
                    step.isFirst
                      ? "border-t-2 border-blue"
                      : "border-t-2 border-blue-wash"
                  }`}
                >
                  <span
                    className={`font-mono text-mono-label font-semibold ${
                      step.isFirst ? "text-blue" : "text-muted"
                    }`}
                  >
                    {step.step}
                  </span>
                  <div className="text-body font-bold text-ink">{step.title}</div>
                  <div className="text-caption leading-[1.6] text-ink-body">
                    {step.text}
                  </div>
                </div>
              </RevealItem>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------------- 04 CTA */}
      <Section tone="blue" pad="band">
        <Reveal className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center md:gap-12">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-h2 font-extrabold tracking-tight text-white lg:text-[30px]">
              Not sure which one you need?
            </h2>
            <p className="text-body text-[#C9D2FB]">
              Describe the problem and I will tell you which of these fixes it,
              or that none of them do.
            </p>
          </div>
          <div className="shrink-0">
            <Button href="/contact" variant="inverse" withArrow>
              Start a Project
            </Button>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
