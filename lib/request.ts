import "server-only";

/**
 * True when a request comes from a page on this site.
 *
 * Server Actions compare the Origin header with the host themselves; route
 * handlers that change data do not, so they call this. The host is the one the
 * browser used — x-forwarded-host behind Nginx, host otherwise — which is the
 * same comparison Next.js makes for actions.
 *
 * A request with no Origin at all is refused. Browsers send one on every POST,
 * so only a non-browser client omits it, and an admin mutation has no reason
 * to come from one.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
