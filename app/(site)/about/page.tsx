import type { Metadata } from "next";
import Image from "next/image";
import { Button, Card, SectionHeading } from "@/components/ui";
import { PersonGlyph } from "@/components/site/icons";
import { Reveal, RevealItem } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { PersonJsonLd } from "@/components/site/JsonLd";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "About",
  description:
    "The three versions of Garsame Mohamud — v1 the field worker, v2 the builder, v3 the independent engineer.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PersonJsonLd
        location={settings.location}
        socialLinks={settings.socialLinks}
        description={settings.bioShort || settings.bioLong}
      />
      {/* ----------------------------------------------------------- 01 Hero */}
      <Section tone="gradient" pad="hero">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div className="flex flex-col items-start gap-5">
            <span className="font-mono text-mono-label uppercase tracking-widest text-blue">
              {"// About me"}
            </span>
            <h1 className="text-display font-extrabold tracking-tight text-ink lg:text-[48px] lg:leading-[1.14]">
              Three versions of
              <br />
              the same <span className="text-blue">person</span>
            </h1>
            <p className="max-w-[540px] text-body-large leading-[1.75] text-ink-body">
              {settings.bioLong ||
                "I did not come to software from a computer. I came to it from a registration desk in a displacement camp, where I watched good people lose an entire day to a form that should have taken two minutes. That is still the work. The tools changed."}
            </p>
            <div className="flex flex-wrap gap-3 pt-1.5">
              <Button href="/contact">Work with me</Button>
              <Button
                href={settings.cvFile?.url || "/contact"}
                variant="secondary"
                newTab={Boolean(settings.cvFile)}
              >
                Download CV
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative flex h-[400px] w-[320px] flex-col items-center justify-center overflow-hidden rounded-t-[160px] rounded-b-card border-2 border-dashed border-blue-pale bg-[#F2F5FE]">
              {settings.heroPortrait ? (
                <Image
                  src={settings.heroPortrait.url}
                  alt="Garsame Mohamud"
                  fill
                  sizes="320px"
                  className="object-cover object-top"
                />
              ) : (
                <>
                  <PersonGlyph size={40} className="text-[#8C9CE4]" />
                  <span className="font-mono text-mono-label text-[#8C9CE4]">
                    [ PORTRAIT ]
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- 02 v1 */}
      <Section tone="tint">
        <Reveal className="grid grid-cols-1 items-start gap-8 md:grid-cols-[200px_1fr] md:gap-12">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[34px] font-semibold leading-none text-faint">
              v1
            </span>
            <span className="font-mono text-[11px] tracking-[0.1em] text-muted">
              THE FIELD
            </span>
          </div>

          <div className="flex max-w-[760px] flex-col gap-4">
            <h2 className="text-h2 font-bold tracking-tight text-ink">
              Years of watching systems fail people
            </h2>
            <p className="text-body-large leading-[1.8] text-ink-3">
              I worked across Somalia with the Danish Refugee Council, MUDRO,
              Polish Humanitarian Action and Save the Children International,
              where I was a Nutrition Registration Officer. Registration,
              procurement, logistics. Long days, paper forms, queues that did not
              move.
            </p>
            <p className="text-body-large leading-[1.8] text-ink-3">
              What I learned there is the thing I still sell. Organisations do
              not break where the plan says they will. They break at the counter,
              in the heat, when the network is down and a mother has been waiting
              three hours. Any system that has not been designed for that moment
              is a system that will be abandoned.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1.5">
              {[
                "Danish Refugee Council",
                "MUDRO",
                "Polish Humanitarian Action",
                "Save the Children",
              ].map((org) => (
                <span
                  key={org}
                  className="rounded-[6px] border border-border bg-white px-3 py-1.75 font-mono text-mono-label text-[#5A6790]"
                >
                  {org}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------------- 03 v2 */}
      <Section tone="white">
        <Reveal className="grid grid-cols-1 items-start gap-8 md:grid-cols-[200px_1fr] md:gap-12">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[34px] font-semibold leading-none text-faint">
              v2
            </span>
            <span className="font-mono text-[11px] tracking-[0.1em] text-muted">
              THE BUILDER
            </span>
          </div>

          <div className="flex max-w-[760px] flex-col gap-4">
            <h2 className="text-h2 font-bold tracking-tight text-ink">
              Learning to build the thing I kept wishing for
            </h2>
            <p className="text-body-large leading-[1.8] text-ink-3">
              I already held a degree in Public Administration from the
              University of Kismayo. I went back and took Computer Science at
              Hormuud University, because understanding why an organisation fails
              is not the same as being able to fix it.
            </p>
            <p className="text-body-large leading-[1.8] text-ink-3">
              My final-year project became a working platform that turns a
              recorded lecture into study notes in Somali — a language most
              systems do not serve at all. A condensed version was presented at
              the Hormuud University Multidisciplinary Conference in 2026. In the
              same period I built systems for a university bus union, a
              restaurant, a health care company and a hiring platform of my own.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------------- 04 v3 */}
      <Section tone="ink">
        <Reveal className="grid grid-cols-1 items-start gap-8 md:grid-cols-[200px_1fr] md:gap-12">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[34px] font-bold leading-none text-blue-light">
              v3
            </span>
            <span className="font-mono text-[11px] tracking-[0.1em] text-blue-light">
              THE ENGINEER · NOW
            </span>
          </div>

          <div className="flex max-w-[760px] flex-col gap-4">
            <h2 className="text-h2 font-bold tracking-tight text-white">
              Independent, and building for businesses here
            </h2>
            <p className="text-body-large leading-[1.8] text-[#B3BCD8]">
              I work for myself now, with businesses in Mogadishu and across East
              Africa. Health care, transport, retail, hiring. The work is the same
              shape every time: find the part of the day that is being wasted, and
              give it back.
            </p>
            <p className="text-body-large leading-[1.8] text-[#B3BCD8]">
              What v1 gave me is the thing most developers never get — the
              instinct to cut a feature that looks impressive and will not
              survive. What v2 gave me is the ability to build the rest properly.
              v3 is both of those in one person, and that is who you are hiring.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------- 05 Education */}
      <Section tone="white">
        <Reveal className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Education and research"
            heading="On paper"
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <RevealItem>
              <Card className="flex flex-col gap-2 p-6.5">
                <span className="font-mono text-mono-meta text-muted">DEGREE</span>
                <div className="text-[18px] font-bold text-ink">
                  BSc Computer Science
                </div>
                <div className="text-small leading-[1.6] text-ink-body">
                  Hormuud University, Mogadishu
                </div>
              </Card>
            </RevealItem>

            <RevealItem>
              <Card className="flex flex-col gap-2 p-6.5">
                <span className="font-mono text-mono-meta text-muted">DEGREE</span>
                <div className="text-[18px] font-bold text-ink">
                  Public Administration
                </div>
                <div className="text-small leading-[1.6] text-ink-body">
                  University of Kismayo
                </div>
              </Card>
            </RevealItem>

            <RevealItem>
              <Card className="flex flex-col gap-2 p-6.5">
                <span className="font-mono text-mono-meta text-muted">
                  RESEARCH
                </span>
                <div className="text-[18px] font-bold text-ink">HUMC 2026</div>
                <div className="text-small leading-[1.6] text-ink-body">
                  Paper presented on Somali lecture transcription and note
                  generation
                </div>
              </Card>
            </RevealItem>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------ 06 Principles */}
      <Section tone="tint">
        <Reveal className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="How I think"
            heading="Four things I will not move on"
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              {
                idx: "01",
                title: "The best feature is often the one removed",
                text: "If it will not work when the signal drops, it does not belong in the plan, however good it looks in the proposal.",
              },
              {
                idx: "02",
                title: "Your staff are the real test",
                text: "If the person at the counter cannot use it on their first morning without help, I built it wrong.",
              },
              {
                idx: "03",
                title: "You own everything",
                text: "The code, the database, the server and the documentation. A client who cannot leave is not a client, they are a hostage.",
              },
              {
                idx: "04",
                title: "I say no when it is a no",
                text: "If your problem is not one I solve well, I will tell you in the first conversation rather than take the money.",
              },
            ].map((p) => (
              <RevealItem key={p.idx}>
                <Card className="flex items-start gap-4.5 p-7">
                  <span className="rounded-[6px] bg-accent-soft px-2.25 py-1.5 font-mono text-mono-label text-blue">
                    {p.idx}
                  </span>
                  <div className="flex flex-col gap-1.75">
                    <div className="text-[17px] font-bold text-ink">
                      {p.title}
                    </div>
                    <div className="text-small leading-[1.65] text-ink-body">
                      {p.text}
                    </div>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------------------------------------- 07 CTA */}
      <Section tone="blue" pad="band">
        <Reveal className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center md:gap-12">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-h2 font-extrabold tracking-tight text-white lg:text-[32px]">
              Tell me what is slowing you down
            </h2>
            <p className="text-body text-[#C9D2FB]">
              I reply within a day, and the first conversation costs nothing.
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
