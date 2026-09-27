import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageViewTracker } from "@/components/site/PageViewTracker";

/**
 * The public shell. Everything in the (site) group gets the sticky header and
 * the footer; /admin and /dev are outside it and get neither.
 *
 * The header and footer live here rather than in a template, so they persist
 * across navigation and do not re-animate on every page change.
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
      {/* `flex-1` keeps the footer at the bottom on short pages such as /404. */}
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
