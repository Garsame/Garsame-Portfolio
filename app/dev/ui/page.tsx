import type { Metadata } from "next";
import {
  Badge,
  Button,
  Card,
  CardCover,
  Checkbox,
  Container,
  FilterPill,
  FormField,
  IconTile,
  Input,
  SectionHeading,
  Select,
  StatusChip,
  Textarea,
  Wordmark,
} from "@/components/ui";
import { ArrowUpRight, Check, Minus, Plus } from "@/components/ui/icons";
import { Section } from "@/components/site/Section";
import { Reveal, RevealItem } from "@/components/site/Reveal";

/**
 * The UI kit, every component in every state — Phase 1.
 *
 * A development surface, not a page of the site. It is noindex, it is not in
 * the nav, and nothing here is site content.
 */

export const metadata: Metadata = {
  title: "UI kit",
  robots: { index: false, follow: false },
};

/* ------------------------------------------------------------- page helpers */

function Group({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="flex flex-col gap-6 border-t border-border pt-8"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-h3 text-ink">{title}</h2>
        {note ? <p className="text-small text-ink-body">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-mono-meta text-muted uppercase">
        {label}
      </span>
      <div className={className ?? "flex flex-wrap items-center gap-4"}>
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- the data */

const typeLevels = [
  ["Display", "text-display-sm lg:text-display", "52 / 800 / -0.035em"],
  ["H1", "text-h1-sm lg:text-h1", "40 / 800 / -0.03em"],
  ["H2", "text-h2-sm lg:text-h2", "30 / 700 / -0.025em"],
  ["H3", "text-h3", "20 / 700 / -0.02em"],
  ["Body large", "text-body-lg", "16 / 400 / 1.7"],
  ["Body", "text-body", "15 / 400 / 1.7"],
  ["Small", "text-small", "14 / 400 / 1.6"],
  ["Caption", "text-caption", "13 / 400 / 1.5"],
  ["Mono label", "font-mono text-mono-label uppercase", "12 / 500 / 0.14em"],
  ["Mono meta", "font-mono text-mono-meta", "11 / 500 / 0.08em"],
  ["Mono chip", "font-mono text-mono-chip uppercase", "10 / 400 / 0.08em"],
] as const;

const palette = [
  [
    "Surfaces",
    [
      "bg-white",
      "bg-tint",
      "bg-tint-soft",
      "bg-field",
      "bg-accent-soft",
      "bg-accent-wash",
    ],
  ],
  [
    "Ink",
    [
      "bg-ink",
      "bg-ink-2",
      "bg-ink-3",
      "bg-ink-body",
      "bg-muted",
      "bg-muted-strong",
      "bg-faint",
    ],
  ],
  [
    "Accent",
    [
      "bg-blue",
      "bg-blue-hover",
      "bg-blue-light",
      "bg-blue-pale",
      "bg-blue-wash",
    ],
  ],
  [
    "Lines",
    ["bg-border", "bg-border-strong", "bg-border-header", "bg-border-faint"],
  ],
  [
    "Status",
    [
      "bg-success",
      "bg-success-bg",
      "bg-warning",
      "bg-warning-bg",
      "bg-danger",
      "bg-danger-bg",
      "bg-neutral-bg",
    ],
  ],
] as const;

const statuses = ["live", "building", "completed", "concept"] as const;

const needOptions = [
  "One place for the whole business",
  "An app for my customers",
  "A dashboard and reports",
  "Something else",
];

/* -------------------------------------------------------------------- page */

export default function DevUiPage() {
  return (
    <div className="min-h-screen bg-white py-11">
      <Container innerClassName="flex flex-col gap-11">
        {/* ------------------------------------------------------- masthead */}
        <header className="flex flex-col gap-4">
          <Wordmark href={null} />
          <h1 className="text-h1-sm lg:text-h1">
            The UI kit <span className="text-blue">in every state</span>
          </h1>
          <p className="max-w-sub-wide text-body-lg text-ink-body">
            Phase 1. Every shared component in{" "}
            <code className="font-mono text-small text-ink-2">
              /components/ui
            </code>
            , built against the tokens. Nothing on this page contains a hex, a
            font size or a pixel value of its own.
          </p>
          <p className="font-mono text-mono-meta text-muted uppercase">
            Development page · noindex · not part of the site
          </p>
        </header>

        {/* ---------------------------------------------------------- type */}
        <Group
          id="type"
          title="Type levels"
          note="Sizing is by named level only. Each level carries its own weight, line height and tracking — there is no font-size control anywhere in this project."
        >
          <div className="flex flex-col gap-5">
            {typeLevels.map(([name, cls, meta]) => (
              <div
                key={name}
                className="flex flex-col gap-1 border-b border-border-faint pb-4 lg:flex-row lg:items-baseline lg:gap-8"
              >
                <span className="w-32 shrink-0 font-mono text-mono-meta text-muted uppercase">
                  {name}
                </span>
                <span className={`${cls} flex-1 text-ink`}>
                  Complex problems, simple software
                </span>
                <span className="shrink-0 font-mono text-mono-meta text-faint">
                  {meta}
                </span>
              </div>
            ))}
          </div>
        </Group>

        {/* -------------------------------------------------------- palette */}
        <Group
          id="palette"
          title="Palette"
          note="Tailwind's own colours are cleared — bg-blue-500 does not exist. These are the only colours in the system."
        >
          <div className="flex flex-col gap-6">
            {palette.map(([name, swatches]) => (
              <Row key={name} label={name}>
                {swatches.map((sw) => (
                  <div key={sw} className="flex flex-col gap-2">
                    <div
                      className={`size-16 rounded-input border border-border ${sw}`}
                    />
                    <span className="font-mono text-mono-meta text-muted">
                      {sw.replace("bg-", "")}
                    </span>
                  </div>
                ))}
              </Row>
            ))}
          </div>
        </Group>

        {/* -------------------------------------------------------- buttons */}
        <Group
          id="buttons"
          title="Button"
          note="The clipped top-right corner is the signature. The secondary variant is a two-layer wrapper: an outer layer in border-strong with 1px of padding, an inner in white clipped one pixel smaller."
        >
          <Row label="Primary — md, sm, with arrow, disabled">
            <Button>Start a Project</Button>
            <Button size="sm">Start a Project</Button>
            <Button withArrow>Start a Project</Button>
            <Button size="sm" withArrow>
              Start a Project
            </Button>
            <Button disabled>Disabled</Button>
          </Row>

          <Row label="Secondary — md, sm, with arrow, disabled">
            <Button variant="secondary">See the projects</Button>
            <Button variant="secondary" size="sm">
              See all projects
            </Button>
            <Button variant="secondary" withArrow>
              See the projects
            </Button>
            <Button variant="secondary" size="sm" withArrow>
              See all projects
            </Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </Row>

          <Row label="Ghost — the in-content CTA">
            <Button variant="ghost" withArrow>
              See the project
            </Button>
            <Button variant="ghost" size="sm" withArrow>
              Read the full story
            </Button>
            <Button variant="ghost" disabled withArrow>
              Disabled
            </Button>
          </Row>

          <Row label="With a leading icon">
            <Button icon={<Plus size={14} />}>Write a testimonial</Button>
            <Button variant="secondary" icon={<Check size={14} />} size="sm">
              Saved
            </Button>
          </Row>

          <Row
            label="Block — form submits"
            className="flex max-w-90 flex-col gap-4"
          >
            <Button block>Join</Button>
            <Button block variant="secondary">
              Cancel
            </Button>
          </Row>

          <Row label="As links (href renders an anchor)">
            <Button href="/dev/ui" withArrow>
              Internal link
            </Button>
            <Button href="/dev/ui" variant="ghost" withArrow>
              Ghost link
            </Button>
          </Row>
        </Group>

        {/* ------------------------------------------------- section heading */}
        <Group
          id="section-heading"
          title="SectionHeading"
          note="The eyebrow gets its // here, not from the caller, and the final phrase of the heading is a separate prop so the accent cannot be forgotten. This pattern is mandatory."
        >
          <div className="flex flex-col gap-11">
            <div className="rounded-card border border-border p-8">
              <SectionHeading
                eyebrow="Projects"
                heading="Systems that are"
                accent="running"
              />
            </div>

            <div className="rounded-card border border-border bg-tint p-8">
              <SectionHeading
                align="center"
                eyebrow="What I do for you"
                heading="How can I help your"
                accent="business"
                sub="You tell me what is slow, confusing or costing you money. I build the thing that fixes it."
              />
            </div>

            <div className="rounded-card bg-ink p-8">
              <SectionHeading
                tone="ink"
                eyebrow="Membership"
                heading="Be the first to see what I build next"
                sub="Members hear about new systems, new writing and what I have learned before anyone else."
                subMaxWidth="max-w-sub-ink"
              />
            </div>

            <div className="rounded-card bg-blue p-8">
              <SectionHeading
                tone="blue"
                eyebrow="The promise"
                heading="It works when the network"
                accent="does not"
                sub="Your staff will not lose a sale or a patient record because the signal dropped."
              />
            </div>

            <div className="rounded-card border border-border bg-tint p-8">
              <SectionHeading
                align="center"
                mutedEyebrow
                eyebrow="Working with"
                heading="A muted eyebrow"
                sub="Section 08 uses muted rather than blue."
              />
            </div>
          </div>
        </Group>

        {/* ---------------------------------------------------------- cards */}
        <Group
          id="cards"
          title="Card"
          note="Plain rounded 14px, one soft shadow, no clipped corner. Hover the interactive ones: the border darkens, the card lifts 2px and a cover image scales to 1.02, all over 200ms."
        >
          <Row label="Tones" className="grid gap-5 lg:grid-cols-4">
            <Card className="gap-3 p-6">
              <h3 className="text-h3">White</h3>
              <p className="text-small leading-cozy text-ink-body">
                The default card, on a tint section.
              </p>
            </Card>
            <Card tone="tint-soft" className="gap-3 p-6">
              <h3 className="text-h3">Tint soft</h3>
              <p className="text-small leading-cozy text-ink-body">
                Form panels and inset cards.
              </p>
            </Card>
            <Card tone="accent-soft" className="gap-3 p-6">
              <h3 className="text-h3">Accent soft</h3>
              <p className="text-small leading-cozy text-on-ink-soft">
                The v3 card, with a blue border.
              </p>
            </Card>
            <Card tone="ink" className="gap-3 p-6">
              <span className="font-mono text-mono-meta text-blue-light uppercase">
                {"// your turn"}
              </span>
              <h3 className="text-h3 text-white">Ink</h3>
              <p className="text-small leading-cozy text-on-ink-body">
                Used exactly twice on the home page.
              </p>
            </Card>
          </Row>

          <Row
            label="Interactive — a project card, hover it"
            className="grid gap-5 lg:grid-cols-3"
          >
            {statuses.slice(0, 3).map((status, i) => (
              <Card key={status} href="/dev/ui" className="overflow-hidden">
                <CardCover
                  overlay={
                    <span className="absolute top-4 left-4 font-mono text-mono-meta font-semibold text-blue">
                      {`/ 00${i + 1}`}
                    </span>
                  }
                >
                  <svg
                    width="130"
                    height="80"
                    viewBox="0 0 130 80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-placeholder-line"
                    aria-hidden="true"
                  >
                    <rect x="1" y="1" width="128" height="78" rx="4" />
                    <line x1="1" y1="18" x2="129" y2="18" />
                    <rect x="10" y="28" width="44" height="40" rx="3" />
                    <line x1="64" y1="32" x2="118" y2="32" />
                    <line x1="64" y1="44" x2="102" y2="44" />
                  </svg>
                </CardCover>
                <div className="flex flex-col gap-2.5 p-5.5">
                  <div className="flex items-center gap-2">
                    <StatusChip status={status} />
                    <span className="font-mono text-mono-meta text-muted">
                      2026
                    </span>
                  </div>
                  <h3 className="text-h3">Example project</h3>
                  <p className="text-small leading-normal text-ink-body">
                    A one-line summary of what the business gained, in plain
                    words.
                  </p>
                  <span className="flex items-center gap-2 pt-1.5 text-small font-semibold text-blue">
                    See the project
                    <ArrowUpRight size={13} />
                  </span>
                </div>
              </Card>
            ))}
          </Row>
        </Group>

        {/* --------------------------------------------------------- badges */}
        <Group
          id="badges"
          title="Badge, StatusChip and FilterPill"
          note="StatusChip covers the four project states in the data model. Completed has no chip anywhere in design/ — it takes the accent family, recorded as D-013."
        >
          <Row label="StatusChip — the four project states">
            {statuses.map((s) => (
              <StatusChip key={s} status={s} />
            ))}
          </Row>

          <Row label="Badge — generic tones">
            <Badge tone="accent">Accent</Badge>
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="success">Sent</Badge>
            <Badge tone="warning">Pending</Badge>
            <Badge tone="danger">Failed</Badge>
            <Badge tone="solid">Featured</Badge>
          </Row>

          <Row label="FilterPill — active and inactive">
            <FilterPill active>All · 12</FilterPill>
            <FilterPill>Web app · 4</FilterPill>
            <FilterPill>Mobile app · 3</FilterPill>
            <FilterPill>Platform · 3</FilterPill>
            <FilterPill>Website · 2</FilterPill>
          </Row>

          <Row label="Wordmark — md, sm, admin">
            <Wordmark href={null} />
            <Wordmark href={null} size="sm" />
            <Wordmark href={null} size="admin" />
            <span className="rounded-input bg-ink p-4">
              <Wordmark href={null} tone="white" size="sm" />
            </span>
          </Row>
        </Group>

        {/* ------------------------------------------------------ icon tiles */}
        <Group
          id="icon-tiles"
          title="IconTile"
          note="46px with a 12px radius by default. The contact rows use 44px and the floating hero badges 36px with status tints."
        >
          <Row label="Sizes — md 46, lg 44, sm 36">
            <IconTile>
              <Plus size={22} />
            </IconTile>
            <IconTile size="lg">
              <Plus size={19} />
            </IconTile>
            <IconTile size="sm">
              <Plus size={18} />
            </IconTile>
          </Row>

          <Row label="Tones">
            <IconTile tone="accent">
              <Check size={22} />
            </IconTile>
            <IconTile tone="success">
              <Check size={22} />
            </IconTile>
            <IconTile tone="warning">
              <Check size={22} />
            </IconTile>
            <IconTile tone="danger">
              <Check size={22} />
            </IconTile>
            <span className="rounded-input bg-ink p-3">
              <IconTile tone="white">
                <Check size={22} />
              </IconTile>
            </span>
          </Row>

          <Row label="Icons in the kit">
            <span className="flex items-center gap-5 text-ink-3">
              <ArrowUpRight size={18} />
              <Plus size={18} />
              <Minus size={18} />
              <Check size={18} />
            </span>
          </Row>
        </Group>

        {/* ---------------------------------------------------------- forms */}
        <Group
          id="forms"
          title="Input, Textarea, Select, Checkbox, FormField"
          note="Client validation is convenience only — rule 7 puts the real check on the server. Every control takes an error string, sets aria-invalid and points aria-describedby at the message."
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col gap-5">
              <Row label="Default, hint, error" className="flex flex-col gap-5">
                <FormField label="Full name" htmlFor="demo-name" required>
                  <Input id="demo-name" placeholder="Your name" />
                </FormField>

                <FormField
                  label="Email address"
                  htmlFor="demo-email"
                  hint="Private. Used only to verify the submission."
                >
                  <Input
                    id="demo-email"
                    type="email"
                    placeholder="you@example.com"
                  />
                </FormField>

                <FormField
                  label="Email address"
                  htmlFor="demo-email-err"
                  error="Enter an email address so I can reply."
                >
                  <Input
                    id="demo-email-err"
                    type="email"
                    defaultValue="not-an-email"
                    error="Enter an email address so I can reply."
                  />
                </FormField>

                <FormField label="Disabled" htmlFor="demo-disabled">
                  <Input
                    id="demo-disabled"
                    placeholder="Not editable"
                    disabled
                    className="opacity-50"
                  />
                </FormField>
              </Row>
            </div>

            <div className="flex flex-col gap-5">
              <Row
                label="Select, textarea, checkbox"
                className="flex flex-col gap-5"
              >
                <FormField label="What do you need?" htmlFor="demo-need">
                  <Select id="demo-need" defaultValue="">
                    <option value="" disabled>
                      Choose one
                    </option>
                    {needOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField
                  label="Tell me about the problem"
                  htmlFor="demo-message"
                  required
                >
                  <Textarea
                    id="demo-message"
                    rows={5}
                    placeholder="What is taking too long, costing too much, or going wrong? Plain words are fine."
                  />
                </FormField>

                <Checkbox
                  id="demo-consent"
                  label="I am happy for this to be published on the site with my name and business."
                />

                <Checkbox
                  id="demo-consent-err"
                  error="You need to agree before this can be published."
                  label="Consent, showing an error."
                />
              </Row>
            </div>
          </div>

          <Row
            label="On a tint panel — controls switch to the field tone"
            className="max-w-sub"
          >
            <div className="flex w-full flex-col gap-3 rounded-card border border-border bg-tint-soft p-8">
              <h3 className="text-h3">Become a member</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input tone="field" placeholder="First name" />
                <Input tone="field" placeholder="Last name" />
              </div>
              <Input tone="field" type="email" placeholder="Email address" />
              <Button block>Join</Button>
              <p className="text-center text-caption text-muted">
                Your details stay with me. One message at a time, never a flood.
              </p>
            </div>
          </Row>
        </Group>

        {/* ------------------------------------------------------- container */}
        <Group
          id="container"
          title="Container"
          note="Gutters of 120px desktop and 24px mobile, with content capped at 1200px. The whole of this page is inside one."
        >
          <div className="bg-tint py-8">
            <Container>
              <div className="rounded-card border border-border bg-white p-6 text-small text-ink-body">
                This box sits inside a Container. At 1440px the gutter is 120px
                and this measures exactly 1200px — the width the approved
                screens are drawn at.
              </div>
            </Container>
          </div>
        </Group>
      </Container>

      {/* ----------------------------------------------------- section rhythm */}
      {/* Outside the Container: Section is full-bleed and holds its own. */}
      <div className="mt-11 flex flex-col gap-6">
        <Container>
          <div className="flex flex-col gap-1 border-t border-border pt-8">
            <h2 className="text-h3 text-ink">
              Section — the background rhythm
            </h2>
            <p className="text-small text-ink-body">
              Each band sets its own background and padding. The order below is
              the real one from the home page. There is no numbered spine — it
              was removed at Garsame&apos;s request (D-044).
            </p>
          </div>
        </Container>

        <div className="flex flex-col">
          <Section tone="gradient" pad="hero">
            <p className="text-body text-ink-body">
              gradient — the hero. tint-soft to white.
            </p>
          </Section>
          <Section tone="blue" pad="band">
            <p className="text-body text-on-blue-body">
              blue — the promise band. 54px padding.
            </p>
          </Section>
          <Section tone="tint">
            <p className="text-body text-ink-body">
              tint — services. The default 92px padding.
            </p>
          </Section>
          <Section tone="white">
            <p className="text-body text-ink-body">white — projects.</p>
          </Section>
          <Section tone="accent-wash" pad="none" className="py-11">
            <p className="text-body text-placeholder-ink-3">
              accent-wash — the full-bleed break band, with a top and bottom
              border.
            </p>
          </Section>
          <Section tone="ink" pad="ink-band">
            <p className="text-body text-on-ink-body">
              ink — membership. 74px padding. Used exactly twice on the home
              page.
            </p>
          </Section>
        </div>
      </div>

      {/* ------------------------------------------------------------- reveal */}
      <Container className="mt-11">
        <div className="flex flex-col gap-6 border-t border-border pt-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3 text-ink">Reveal — the section reveal</h2>
            <p className="text-small text-ink-body">
              Fade in, rise 16px, children staggered 60ms, fires once. Reload
              and scroll down to this block to see it. With{" "}
              <code className="font-mono text-caption text-ink-2">
                prefers-reduced-motion
              </code>{" "}
              it renders instantly at its final position, and a no-script rule
              in the root layout forces it visible if JavaScript never arrives.
            </p>
          </div>

          <Reveal className="grid gap-5 lg:grid-cols-3">
            {["First", "Second", "Third"].map((label) => (
              <RevealItem key={label}>
                <Card className="gap-2 p-6">
                  <span className="font-mono text-mono-meta text-muted uppercase">
                    {label}
                  </span>
                  <p className="text-small leading-cozy text-ink-body">
                    Each of these is a RevealItem, so they arrive 60ms apart
                    rather than together.
                  </p>
                </Card>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </Container>

      <Container className="mt-11">
        <footer className="border-t border-border pt-8 font-mono text-mono-meta text-muted uppercase">
          End of the kit · Phases 1 and 2
        </footer>
      </Container>
    </div>
  );
}
