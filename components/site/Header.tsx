"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button, Container, Wordmark } from "@/components/ui";
import { cn } from "@/lib/utils";
import { NAV, isCurrent } from "@/lib/nav";
import { EASE_ENTRANCE, SHEET } from "@/lib/motion";

/**
 * The sticky header — design/02-about.html and the eight screens that match it.
 *
 * 76px tall, the wordmark left, the eight nav links centre, the Start a Project
 * button right. The current page is blue and 600 weight.
 *
 * Below 1280px the links collapse into a full-screen sheet that fades in and
 * rises 8px over 250ms — see the note on the nav below for why 1280.
 *
 * A client component, because the sheet has state and the active link needs
 * the pathname. It is the only client component in the shell.
 */
export function Header() {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  /* The sheet stores the path it was opened on rather than a boolean, so it
     closes by itself the moment the route changes — including on a back-button
     navigation. The header does not unmount between routes, so a plain boolean
     would leave the sheet sitting open over the new page, and closing it from
     an effect would be a setState during render's commit. This derives it. */
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const setOpen = (next: boolean) => setOpenPath(next ? pathname : null);

  /* Escape closes it, and the page behind must not scroll while it is open. */
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      /* setOpenPath, not setOpen — the state setter is stable, so the
         effect does not need to re-run when the handler identity changes. */
      if (e.key === "Escape") setOpenPath(null);
    };

    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const link = (href: string, label: string, large = false) => {
    const current = isCurrent(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={current ? "page" : undefined}
        className={cn(
          "transition-button hover:text-blue",
          large ? "text-h3" : "text-body",
          current ? "font-semibold text-blue" : "font-medium text-ink-2",
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border-header bg-white">
      <Container innerClassName="flex h-header items-center justify-between gap-8">
        <Wordmark />

        {/* The nav appears at 1280px, not 1024px. Eight links plus the
            wordmark and the CTA need about 886px, and a 1024px viewport with
            the design's 120px gutters leaves 784px — it overflowed. Rather
            than shrink the gutter or the gap away from the approved values,
            the sheet covers everything below 1280px.  */}
        <nav
          aria-label="Main"
          className="hidden items-center gap-nav-gap xl:flex"
        >
          {NAV.map((item) => link(item.href, item.label))}
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          {/* Wrapped rather than given `hidden sm:inline-flex` directly: `cn`
              only concatenates, so a display class passed to Button cannot beat
              the `inline-flex` the component sets on itself. Below 640px the
              CTA lives at the bottom of the sheet instead. */}
          <span className="hidden shrink-0 sm:block">
            <Button href="/contact" size="nav">
              Start a Project
            </Button>
          </span>

          {/* The sheet trigger. 44px square, to meet the tap target minimum. */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="nav-sheet"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-11 items-center justify-center rounded-input text-ink-2 transition-button hover:text-blue xl:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <path d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="nav-sheet"
            initial={reduced ? false : { opacity: 0, y: SHEET.rise }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              duration: reduced ? 0 : SHEET.duration,
              ease: EASE_ENTRANCE,
            }}
            className="fixed inset-x-0 top-header bottom-0 z-40 overflow-y-auto bg-white xl:hidden"
          >
            <Container className="py-8">
              <nav
                aria-label="Main"
                className="flex flex-col items-start gap-5"
              >
                {NAV.map((item) => link(item.href, item.label, true))}
              </nav>

              <div className="mt-8 sm:hidden">
                <Button href="/contact" block>
                  Start a Project
                </Button>
              </div>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
