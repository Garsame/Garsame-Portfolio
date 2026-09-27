import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "../styles/globals.css";
import { site } from "@/lib/content/home";

/* Self-hosted by next/font, so no request leaves for Google and there is no
   layout shift on load — docs/02-DESIGN-SYSTEM.md, and the performance
   targets in CLAUDE.md. Exposed as CSS variables, which styles/tokens.css
   reads into --font-sans and --font-mono. */

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  /* Resolves relative URLs in page metadata — canonical links and sharing
     images. The real domain replaces localhost when it is known (D-058). */
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: site.title,
    template: "%s — GARSAME v3",
  },
  description: site.metaDescription,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "GARSAME v3",
    title: site.title,
    description: site.metaDescription,
    images: [
      {
        url: "/api/og?title=Garsame+Mohamud&type=portfolio",
        width: 1200,
        height: 630,
        alt: site.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.metaDescription,
    images: ["/api/og?title=Garsame+Mohamud&type=portfolio"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${plexMono.variable}`}>
      <head>
        {/* Framer Motion writes its `initial` styles into the server-rendered
            HTML, so a JavaScript failure would leave revealed content at
            opacity 0. The content is in the DOM for crawlers either way; this
            makes it visible to a reader whose JavaScript never arrives — which
            on Somali mobile data is a real case, not a hypothetical. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important;translate:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
