import "server-only";

import { dbConnect } from "@/lib/db";
import { PageView } from "@/models";

export type TrackPageViewOptions = {
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
};

/**
 * Sanitizes referrer to extract only the host name (e.g. "google.com", "linkedin.com", "direct").
 * Strips all query parameters, paths, and user tokens to protect visitor privacy.
 */
export function sanitizeReferrer(referrer?: string | null): string {
  if (!referrer || referrer.trim() === "") return "Direct";

  try {
    const url = new URL(referrer);
    let host = url.hostname.toLowerCase();
    // Normalize www
    if (host.startsWith("www.")) host = host.slice(4);
    if (host.startsWith("m.")) host = host.slice(2);
    if (host.startsWith("l.")) host = host.slice(2); // l.instagram.com, lm.facebook.com

    if (host.includes("google.")) return "Google";
    if (host.includes("bing.")) return "Bing";
    if (host.includes("duckduckgo.")) return "DuckDuckGo";
    if (host.includes("t.co") || host.includes("twitter.") || host.includes("x.com"))
      return "X (Twitter)";
    if (host.includes("linkedin.")) return "LinkedIn";
    if (host.includes("facebook.") || host.includes("fb.me")) return "Facebook";
    if (host.includes("whatsapp.")) return "WhatsApp";
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("github.")) return "GitHub";
    if (host.includes("reddit.")) return "Reddit";
    if (host.includes("garsame.so") || host.includes("localhost")) return "Internal";

    return host;
  } catch {
    return "Direct";
  }
}

/**
 * Derives anonymous device category from user-agent header without storing raw user-agent.
 */
export function deriveDevice(userAgent?: string | null): "Phone" | "Computer" | "Tablet" {
  if (!userAgent) return "Computer";
  const ua = userAgent.toLowerCase();

  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "Tablet";
  }
  if (/mobile|iphone|ipod|android.*mobile|blackberry|phone|iemobile/i.test(ua)) {
    return "Phone";
  }
  return "Computer";
}

/**
 * Records an anonymous first-party page view event.
 */
export async function trackPageView({
  path,
  referrer,
  userAgent,
  sessionId,
}: TrackPageViewOptions): Promise<void> {
  // Ignore admin and API routes
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/dev")) {
    return;
  }

  await dbConnect();

  const cleanReferrer = sanitizeReferrer(referrer);

  // Exclude internal page-to-page navigation from external referrer tracking
  const finalReferrer = cleanReferrer === "Internal" ? "Direct" : cleanReferrer;
  const device = deriveDevice(userAgent);

  await PageView.create({
    path: path.slice(0, 500),
    referrer: finalReferrer,
    device,
    sessionId: sessionId ? sessionId.slice(0, 64) : undefined,
    viewedAt: new Date(),
  });
}
