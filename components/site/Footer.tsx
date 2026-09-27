import Link from "next/link";
import { Container, Wordmark } from "@/components/ui";
import { NAV } from "@/lib/nav";

/**
 * The footer — docs/03-PAGES.md: wordmark left, nav links centre, the copyright
 * right, on --color-tint with a top border.
 *
 * A server component. Nothing here needs the pathname: the footer does not
 * mark the current page.
 *
 * The year is fixed rather than computed from the clock. `new Date()` on the
 * server would make every page dynamic and defeat static rendering, and a year
 * that changes at midnight UTC is not worth that. Move it to Settings in
 * Phase 9 if it should be editable.
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-tint">
      <Container innerClassName="flex flex-col items-center gap-6 py-footer-y lg:flex-row lg:justify-between lg:gap-8">
        <Wordmark size="sm" />

        <nav
          aria-label="Footer"
          className="flex flex-wrap justify-center gap-x-footer-nav-gap gap-y-3"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-small font-medium text-ink-body transition-button hover:text-blue"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="text-caption text-muted">© 2026 Garsame Mohamud</p>
      </Container>
    </footer>
  );
}
