/**
 * The icons the UI kit itself needs, traced from design/.
 *
 * Inline SVG rather than an icon package: the set is small, the stroke weights
 * differ per context in the approved screens, and CLAUDE.md does not permit a
 * new dependency. Section-specific illustrations live with their sections.
 *
 * Every icon inherits colour through `stroke="currentColor"`, so the parent
 * sets it from a token and no icon carries a colour of its own.
 */

type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

/** The diagonal arrow on buttons and "See the project" links. */
export function ArrowUpRight({
  size = 14,
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 11L11 3M5 3h6v6" />
    </svg>
  );
}

/** The select chevron. */
export function ChevronDown({
  size = 13,
  className,
  strokeWidth = 2,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 5l4 4 4-4" />
    </svg>
  );
}

/** The checkbox tick. */
export function Check({ size = 12, className, strokeWidth = 2.4 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

/** The plus on a closed accordion row. */
export function Plus({ size = 16, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

/** The minus on an open accordion row. */
export function Minus({ size = 16, className, strokeWidth = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8h10" />
    </svg>
  );
}
