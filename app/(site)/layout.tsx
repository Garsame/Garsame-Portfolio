import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageViewTracker } from "@/components/site/PageViewTracker";
import { PageTransition } from "@/components/site/PageTransition";

/**
 * The public shell. Everything in the (site) group gets the sticky header and
 * the footer; /admin and /dev are outside it and get neither.
 *
 * The header and footer live here, outside `PageTransition`, so they persist
 * across navigation and do not re-animate on every page change. `PageTransition`
 * itself must live here too, rather than in a template — see its own comment.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageViewTracker />
      <Header />
      {/* `flex-1` keeps the footer at the bottom on short pages such as /404.
          `relative` gives the exiting page (position: absolute while it fades
          out) something to position against. */}
      <main id="main" className="relative flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}
