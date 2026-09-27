/**
 * Site icons and placeholder illustrations, traced from design/01-home.html.
 *
 * Every one draws with `currentColor`, so the parent sets the colour from a
 * token. The stroke weights are the ones in the design — they differ between
 * a 22px service icon and an 18px badge icon, and matching them is what keeps
 * the icons looking the same weight at different sizes.
 */

import type { HeroBadge, ServiceIcon } from "@/lib/content/home";

type Props = { size?: number; className?: string };

function Svg({
  size,
  viewBox = "0 0 24 24",
  strokeWidth,
  className,
  children,
}: {
  size: number;
  viewBox?: string;
  strokeWidth: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* --------------------------------------------------------- service icons */

const PHONE_HANDSET =
  "M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z";

export function ServiceGlyph({
  icon,
  size = 22,
  className,
}: Props & { icon: ServiceIcon }) {
  const paths: Record<ServiceIcon, React.ReactNode> = {
    screen: (
      <>
        <rect x="2" y="4" width="20" height="15" rx="2" />
        <path d="M2 9h20M8 22h8" />
      </>
    ),
    phone: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="3" />
        <path d="M11 18h2" />
      </>
    ),
    chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    mail: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M22 6l-10 7L2 6" />
      </>
    ),
    automation: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </>
    ),
    support: <path d={PHONE_HANDSET} />,
  };

  return (
    <Svg size={size} strokeWidth={1.6} className={className}>
      {paths[icon]}
    </Svg>
  );
}

/* ----------------------------------------------------------- badge icons */

export function BadgeGlyph({
  icon,
  size = 18,
  className,
}: Props & { icon: HeroBadge["icon"] }) {
  if (icon === "bolt") {
    return (
      <Svg size={size} strokeWidth={1.8} className={className}>
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
      </Svg>
    );
  }
  if (icon === "check") {
    return (
      <Svg size={size} strokeWidth={1.9} className={className}>
        <path d="M4 12l5 5L20 6" />
      </Svg>
    );
  }
  return (
    <Svg size={size} strokeWidth={1.8} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </Svg>
  );
}

/* --------------------------------------------------------- contact icons */

export function PhoneGlyph({ size = 19, className }: Props) {
  return (
    <Svg size={size} strokeWidth={1.7} className={className}>
      <path d={PHONE_HANDSET} />
    </Svg>
  );
}

export function MailGlyph({ size = 19, className }: Props) {
  return (
    <Svg size={size} strokeWidth={1.7} className={className}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </Svg>
  );
}

export function PinGlyph({ size = 19, className }: Props) {
  return (
    <Svg size={size} strokeWidth={1.7} className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  );
}

/* ------------------------------------------------------------ quote mark */

export function QuoteMark({ className }: { className?: string }) {
  return (
    <svg
      width="28"
      height="22"
      viewBox="0 0 28 22"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M0 22V11C0 4.9 4.9 0 11 0v4.4A6.6 6.6 0 0 0 4.4 11H11v11H0zm17 0V11c0-6.1 4.9-11 11-11v4.4A6.6 6.6 0 0 0 21.4 11H28v11H17z" />
    </svg>
  );
}

/* ------------------------------------------------ placeholder artwork */

/** The person outline in the empty portrait slot. */
export function PersonGlyph({ size = 44, className }: Props) {
  return (
    <Svg size={size} strokeWidth={1.4} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </Svg>
  );
}

/** The picture outline in the empty break band. */
export function ImageGlyph({ size = 54, className }: Props) {
  return (
    <Svg size={size} strokeWidth={1.2} className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="8" cy="10" r="2" />
      <path d="M2 17l6-5 5 4 3-3 6 5" />
    </Svg>
  );
}

/** The glyph on a blog cover placeholder, varied by position. */
export function PostArt({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  const variant = index % 3;
  return (
    <Svg size={42} strokeWidth={1.3} className={className}>
      {variant === 0 ? (
        <>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M2 17l6-5 5 4 3-3 6 5" />
        </>
      ) : variant === 1 ? (
        <>
          <rect x="2" y="6" width="20" height="13" rx="2" />
          <path d="M2 10h20M6 15h4" />
        </>
      ) : (
        <>
          <path d="M4 4h16v16H4z" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </>
      )}
    </Svg>
  );
}
