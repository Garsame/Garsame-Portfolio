import type { Metadata } from "next";
import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

/**
 * The 404 — design/11-404.html. Designed, not default, per docs/03-PAGES.md.
 *
 * It carries the Header and Footer itself. A root not-found.tsx renders inside
 * app/layout.tsx only and does not pick up the (site) group's layout, so the
 * shell has to be repeated here to match the approved screen.
 *
 * The two circles behind the 404 are the hero circles at a smaller size —
 * 280px and 210px in the design, against the hero's 460 and 370.
 */

export const metadata: Metadata = {
  title: "That page does not exist",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <Header />

      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center bg-linear-to-b from-tint-soft to-white py-section-sm lg:py-section"
      >
        <Container innerClassName="flex flex-col items-center gap-6 text-center">
          {/* Decorative — the heading already says what happened.
              The wrapper is sized to the outer circle so the two absolute
              circles stay inside its layout box; left unsized they overflow
              and paint over the heading. 78% below 1024px, matching the
              reduction the design system gives the hero circles. */}
          <div
            aria-hidden="true"
            className="relative mb-2 flex size-circle-404-sm items-center justify-center lg:size-circle-404"
          >
            <div className="absolute size-full rounded-full bg-hero-circle-1" />
            <div className="absolute size-circle-404-inner-sm rounded-full bg-hero-circle-2 lg:size-circle-404-inner" />
            <span className="relative font-mono text-numeral-sm text-blue lg:text-numeral">
              404
            </span>
          </div>

          <h1 className="text-h1-sm lg:text-h1">This page does not exist</h1>

          <p className="max-w-prose text-body-lg text-ink-body">
            Either the link was wrong, or I moved something and forgot to leave
            a note. Both are fixable.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2.5">
            <Button href="/">Back to home</Button>
            <Button href="/projects" variant="secondary">
              See the projects
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5.5 gap-y-3 pt-6">
            <span className="font-mono text-mono-eyebrow text-muted uppercase">
              Or try
            </span>
            {[
              { href: "/blog", label: "Blog" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-small font-semibold text-blue transition-button hover:text-blue-hover"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}
