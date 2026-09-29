import Image from "next/image";
import { Button, IconTile } from "@/components/ui";
import { Section } from "@/components/site/Section";
import { BadgeGlyph, PersonGlyph } from "@/components/site/icons";
import {
  hero as defaultHero,
  clients as defaultClients,
  type Availability,
  type HeroBadge,
} from "@/lib/content/home";
import type { PublicSiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { RotatingWord } from "./RotatingWord";

/**
 * 01 Hero — docs/03-PAGES.md, design/01-home.html section 01.
 *
 * Reads dynamic copy and assets from Settings (Phase 9).
 */

const availabilityTone: Record<Availability, string> = {
  available: "text-success",
  limited: "text-warning",
  booked: "text-ink-body",
};

const availabilityDot: Record<Availability, string> = {
  available: "bg-success",
  limited: "bg-warning",
  booked: "bg-ink-body",
};

/** Sets the stagger position for `animate-enter`. */
function enter(index: number): React.CSSProperties {
  return { "--enter-index": index } as React.CSSProperties;
}

export function Hero({ settings }: { settings?: PublicSiteSettings }) {
  const heading1 = settings?.heroHeadingLine1 || defaultHero.headingLine1;
  const heading2Prefix =
    settings?.heroHeadingLine2Prefix || defaultHero.headingLine2Prefix;
  const rotatingWords =
    settings?.heroRotatingWords && settings.heroRotatingWords.length > 0
      ? settings.heroRotatingWords
      : defaultHero.rotatingWords;
  const paragraph = settings?.heroParagraph || defaultHero.paragraph;
  const badges =
    settings?.heroBadges && settings.heroBadges.length === 3
      ? settings.heroBadges
      : defaultHero.badges;
  const portrait = settings?.heroPortrait;
  const clientsList =
    settings?.clients && settings.clients.length > 0
      ? settings.clients
      : defaultClients.map((c) => ({ ...c, avatar: null }));

  return (
    <Section
      tone="gradient"
      pad="hero"
      className="overflow-x-clip"
      innerClassName="grid items-center gap-10 xl:grid-cols-2"
      aria-labelledby="hero-heading"
    >
      <div className="flex flex-col gap-5.5">
        <StatusLine
          availability={settings?.availability || defaultHero.availability}
          availabilityText={
            settings?.availabilityText || defaultHero.availabilityText
          }
          location={settings?.location || defaultHero.location}
        />

        <h1
          id="hero-heading"
          style={enter(1)}
          className="flex animate-enter flex-col gap-0.5 text-display-sm text-ink lg:text-display"
        >
          <span>{heading1}</span>
          <span>
            {heading2Prefix}{" "}
            <RotatingWord words={rotatingWords} className="text-blue" />
          </span>
        </h1>

        <p
          style={enter(2)}
          className="max-w-prose animate-enter text-body-lg text-pretty text-ink-body"
        >
          {paragraph}
        </p>

        <div
          style={enter(3)}
          className="flex animate-enter flex-wrap items-center gap-3.5 pt-2"
        >
          <Button href="/contact" withArrow>
            Start a Project
          </Button>
          <Button href="/projects" variant="secondary">
            See the projects
          </Button>
        </div>

        <ProofRow clients={clientsList} />
      </div>

      <HeroArt portrait={portrait} badges={badges} />
    </Section>
  );
}

/* --------------------------------------------------------------- status */

function StatusLine({
  availability,
  availabilityText,
  location,
}: {
  availability: Availability;
  availabilityText: string;
  location: string;
}) {
  const separator = (
    <span aria-hidden="true" className="text-rule">
      |
    </span>
  );

  return (
    <p
      style={enter(0)}
      className="flex animate-enter flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-mono-label font-regular tracking-meta"
    >
      <span className="font-semibold text-blue">GARSAME v3.0</span>
      {separator}
      <span className="text-ink-body">{location}</span>
      {separator}
      <span
        className={cn(
          "flex items-center gap-1.5",
          availabilityTone[availability],
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block size-1.75 rounded-full",
            availabilityDot[availability],
          )}
        />
        {availabilityText}
      </span>
    </p>
  );
}

/* ------------------------------------------------------------ proof row */

type ProofClient = {
  name: string;
  avatar: { url: string; originalName: string } | null;
};

/* Solid-colour fallback for a client with no avatar uploaded yet — cycles
   through the three avatar tokens rather than always using the first, so a
   row of un-photographed clients doesn't read as one flat colour. */
const AVATAR_FALLBACK = ["bg-avatar-1", "bg-avatar-2", "bg-avatar-3"];

function ProofRow({ clients }: { clients: ProofClient[] }) {
  /* Exactly one avatar per client shown, never a fixed three — D-038 only
     computed the "+N" overflow count, not this. */
  const shown = Math.min(clients.length, 3);
  const visible = clients.slice(0, shown);
  const extra = Math.max(clients.length - shown, 0);
  const boldClients = clients.slice(0, 3).map((c) => c.name);
  const restClients = clients.slice(3).map((c) => c.name);

  return (
    <div
      style={enter(4)}
      className="flex animate-enter items-center gap-3.25 pt-3.5"
    >
      <div aria-hidden="true" className="flex shrink-0">
        {visible.map((client, i) => (
          <span
            key={`${client.name}-${i}`}
            className={cn(
              "size-avatar overflow-hidden rounded-full border-2 border-white",
              !client.avatar && AVATAR_FALLBACK[i % AVATAR_FALLBACK.length],
              i > 0 && "-ml-avatar-overlap",
            )}
          >
            {client.avatar ? (
              <Image
                src={client.avatar.url}
                alt=""
                width={34}
                height={34}
                className="h-full w-full object-cover"
              />
            ) : null}
          </span>
        ))}
        {extra > 0 ? (
          <span className="-ml-avatar-overlap flex size-avatar items-center justify-center rounded-full border-2 border-white bg-blue text-micro text-white">
            +{extra}
          </span>
        ) : null}
      </div>

      <p className="text-caption text-ink-body">
        Working with{" "}
        <span className="font-semibold text-ink">{boldClients.join(", ")}</span>
        {restClients.length > 0 && (
          <>
            <br />
            and {restClients.join(", ")}
          </>
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ art */

function HeroArt({
  portrait,
  badges,
}: {
  portrait?: {
    url: string;
    originalName: string;
    width?: number;
    height?: number;
  } | null;
  badges: HeroBadge[];
}) {
  return (
    <div className="relative mx-auto flex h-(--hero-art-h) w-full max-w-(--hero-art-w) items-end justify-center">
      <div
        aria-hidden="true"
        className="absolute bottom-(--hero-circle-1-bottom) left-1/2 size-(--hero-circle-1) -translate-x-1/2 rounded-full bg-hero-circle-1"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-(--hero-circle-2-bottom) left-1/2 size-(--hero-circle-2) -translate-x-1/2 rounded-full bg-hero-circle-2"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-(--hero-circle-3-bottom) left-1/2 size-(--hero-circle-3) -translate-x-1/2 rounded-full bg-blue"
      />

      {portrait ? (
        <div className="relative z-10 mb-(--hero-portrait-bottom) h-(--hero-portrait-h) w-(--hero-portrait-w)">
          <Image
            src={portrait.url}
            alt="Garsame Mohamud — Portrait"
            width={portrait.width || 340}
            height={portrait.height || 440}
            priority
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="relative z-10 mb-(--hero-portrait-bottom) flex h-(--hero-portrait-h) w-(--hero-portrait-w) flex-col items-center justify-center gap-2 rounded-t-(--hero-portrait-arch) rounded-b-tile border-2 border-dashed border-placeholder-ink bg-placeholder-glass px-4 text-center">
          <PersonGlyph className="text-placeholder-icon" />
          <span className="font-mono text-mono-label font-regular tracking-mono text-placeholder-icon">
            [ YOUR PHOTO ]
          </span>
          <span className="max-w-47.5 text-caption text-placeholder-ink-2">
            cut-out portrait, head breaking above the circles
          </span>
        </div>
      )}

      <FloatingBadge
        badge={badges[0]}
        className="top-(--hero-badge-1-top) left-(--hero-badge-1-left)"
      />
      <FloatingBadge
        badge={badges[1]}
        className="top-(--hero-badge-2-top) right-(--hero-badge-2-right)"
      />
      <FloatingBadge
        badge={badges[2]}
        className="bottom-(--hero-badge-3-bottom) left-(--hero-badge-3-left)"
      />
    </div>
  );
}

function FloatingBadge({
  badge,
  className,
}: {
  badge: HeroBadge;
  className: string;
}) {
  return (
    <div
      className={cn(
        "absolute z-20 flex items-center gap-2.75 rounded-tile border border-border bg-white px-4.25 py-3.25 shadow-badge",
        className,
      )}
    >
      <IconTile size="sm" tone={badge.tone}>
        <BadgeGlyph icon={badge.icon} />
      </IconTile>
      <div className="flex flex-col gap-0.5 whitespace-nowrap">
        <span className="font-mono text-mono-chip tracking-wide text-muted">
          {badge.label}
        </span>
        <span className="text-caption font-bold text-ink">{badge.value}</span>
      </div>
    </div>
  );
}
