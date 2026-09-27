import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "./icons";

/**
 * The button, carrying the signature clipped corner.
 *
 * Three variants and two sizes, measured from design/01-home.html.
 *
 * The secondary variant is a two-layer wrapper, as docs/02-DESIGN-SYSTEM.md
 * requires: an outer element in --color-border-strong with 1px of padding and
 * the clip, and an inner element in white with the clip one pixel smaller.
 * A 1px border cannot follow a clip-path, so the "border" is the sliver of the
 * outer layer showing through — which is how the approved screens draw it.
 *
 * Renders an <a> when given href, a <button> otherwise.
 */

/** `inverse` is a white filled button for dark surfaces — the ink testimonial
    card in design/01-home.html section 09. */
/** `danger` is the outlined button in the danger colour — "Archive project",
    design/28-admin-project-editor.html. */
type Variant = "primary" | "secondary" | "ghost" | "inverse" | "danger";
/** `nav` is the header CTA: slightly tighter than `sm`, with the 11px clip. */
/** `xs` is the admin top-bar button — design/21-admin-dashboard.html. */
type Size = "sm" | "md" | "nav" | "xs";

type ButtonProps = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  /** Open the link in a new tab — for "View site" from the admin. */
  newTab?: boolean;
  /** Show the diagonal arrow after the label. */
  withArrow?: boolean;
  /** Replaces the arrow with your own icon, placed before the label. */
  icon?: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  /** Full width, for forms — design/01-home membership and contact panels. */
  block?: boolean;
  "aria-label"?: string;
};

const layout =
  "inline-flex items-center justify-center font-semibold text-center select-none whitespace-nowrap";

const sizeText: Record<Size, string> = {
  md: "text-body",
  sm: "text-small",
  nav: "text-small",
  xs: "text-caption",
};

const sizeGap: Record<Size, string> = {
  md: "gap-btn-gap",
  sm: "gap-btn-gap-sm",
  nav: "gap-btn-gap-sm",
  xs: "gap-2",
};

/* Filled padding and clip per size. The secondary variant has its own inner
   padding, one pixel tighter, to allow for the wrapper. */
const sizeFill: Record<Size, string> = {
  md: "clip-corner px-btn-x py-btn-y",
  sm: "clip-corner-sm px-btn-sm-x py-btn-sm-y",
  nav: "clip-corner-nav px-btn-nav-x py-btn-nav-y",
  xs: "clip-corner-xs px-btn-xs-x py-btn-xs-y",
};

const sizeOuterClip: Record<Size, string> = {
  md: "clip-corner",
  sm: "clip-corner-sm",
  nav: "clip-corner-nav",
  xs: "clip-corner-xs",
};

const sizeInner: Record<Size, string> = {
  md: "clip-corner-inner px-btn-inner-x py-btn-inner-y",
  sm: "clip-corner-sm-inner px-btn-sm-inner-x py-btn-sm-inner-y",
  nav: "clip-corner-sm-inner px-btn-nav-x py-btn-nav-y",
  xs: "clip-corner-xs-inner px-btn-xs-inner-x py-btn-xs-inner-y",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  newTab = false,
  withArrow = false,
  icon,
  type = "button",
  disabled = false,
  onClick,
  className,
  block = false,
  ...rest
}: ButtonProps) {
  const content = (
    <>
      {icon}
      {children}
      {withArrow ? (
        <ArrowUpRight
          size={size === "md" ? 14 : size === "xs" ? 12 : 13}
          /* On the outlined button the arrow is blue while the label is ink —
             design/01-home, "See all projects" and "Visit the blog". Everywhere
             else it follows the label colour. */
          className={variant === "secondary" ? "text-blue" : undefined}
        />
      ) : null}
    </>
  );

  const linkTarget = newTab
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  const shared = cn(
    layout,
    sizeText[size],
    sizeGap[size],
    block && "w-full",
    disabled && "pointer-events-none opacity-50",
  );

  /* ---------------------------------------------------------------- ghost */
  /* No fill, no padding, no clip — the corner belongs to filled buttons.
     This is the "See the project →" CTA. */
  if (variant === "ghost") {
    const ghost = cn(
      shared,
      "text-blue transition-button hover:text-blue-hover active:scale-98",
      className,
    );

    return href ? (
      <Link href={href} className={ghost} {...linkTarget} {...rest}>
        {content}
      </Link>
    ) : (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={ghost}
        {...rest}
      >
        {content}
      </button>
    );
  }

  /* ------------------------------------------------------------ secondary */
  if (variant === "secondary" || variant === "danger") {
    const danger = variant === "danger";
    const outer = cn(
      "inline-block p-px transition-button active:scale-98",
      danger ? "bg-danger-line" : "bg-border-strong",
      sizeOuterClip[size],
      block && "w-full",
      disabled && "pointer-events-none opacity-50",
      className,
    );

    const inner = cn(
      layout,
      sizeText[size],
      sizeGap[size],
      "w-full bg-white transition-button",
      danger ? "text-danger hover:bg-danger-bg" : "text-ink hover:bg-tint-soft",
      sizeInner[size],
    );

    /* The clip lives on both layers, so the focus ring is drawn inside the
       inner shape by the base layer rule in styles/globals.css. */
    const body = <span className={inner}>{content}</span>;

    return href ? (
      <Link href={href} className={outer} {...linkTarget} {...rest}>
        {body}
      </Link>
    ) : (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={outer}
        {...rest}
      >
        {body}
      </button>
    );
  }

  /* ------------------------------------------------------ primary, inverse */
  const primary = cn(
    shared,
    variant === "inverse"
      ? "bg-white text-ink transition-button hover:bg-accent-soft active:scale-98"
      : "bg-blue text-white transition-button hover:bg-blue-hover active:scale-98",
    sizeFill[size],
    className,
  );

  return href ? (
    <Link href={href} className={primary} {...linkTarget} {...rest}>
      {content}
    </Link>
  ) : (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={primary}
      {...rest}
    >
      {content}
    </button>
  );
}
