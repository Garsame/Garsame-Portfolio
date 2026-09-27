import { cn } from "@/lib/utils";

/**
 * The rounded square behind a section icon: 46px, 12px radius, accent-soft.
 *
 * Three sizes appear in the approved screens — 46px on service cards, 44px on
 * the contact rows, 36px on the floating hero badges — and the hero badges use
 * status tints rather than accent-soft, so tone is a prop.
 */

type Size = "sm" | "md" | "lg";
type Tone = "accent" | "success" | "warning" | "danger" | "white";

const sizeClass: Record<Size, string> = {
  sm: "size-tile-sm rounded-tile-sm", // hero badges — design/01-home
  lg: "size-tile-lg rounded-tile", // contact rows
  md: "size-tile rounded-tile", // service cards
};

const toneClass: Record<Tone, string> = {
  accent: "bg-accent-soft text-blue",
  success: "bg-success-bg text-success",
  warning: "bg-warning-tile text-warning",
  danger: "bg-danger-bg text-danger",
  white: "bg-white text-blue",
};

export function IconTile({
  children,
  size = "md",
  tone = "accent",
  className,
}: {
  children: React.ReactNode;
  size?: Size;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        sizeClass[size],
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
