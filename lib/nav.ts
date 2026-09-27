/**
 * The site navigation, from docs/01-PROJECT-BRIEF.md and docs/03-PAGES.md.
 *
 * One list, used by the header, the mobile sheet and the footer, so the three
 * can never disagree about what the site contains.
 */

export type NavItem = { href: string; label: string };

export const NAV: readonly NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/membership", label: "Membership" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * True when a nav item should read as the current page. `/` matches only
 * itself; every other item also matches its children, so /projects stays
 * marked while on /projects/somalinotes-ai.
 */
export function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
