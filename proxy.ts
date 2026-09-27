import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

/**
 * Route protection at the request boundary — docs/04-ADMIN.md: "Admin routes
 * protected by middleware, not only by UI." In Next.js 16 middleware is called
 * proxy (DECISIONS.md D-003).
 *
 * This is the first of two checks, and deliberately the lighter one. It reads
 * the session cookie without touching the database, and turns away anyone who
 * has no session at all before a page renders. The Next.js 16 docs are explicit
 * that proxy is for these optimistic checks, not full authorisation — so every
 * admin page and every admin API route also calls requireAdmin() in lib/dal.ts,
 * which verifies the session against the database. D-061.
 *
 * - /admin/*      no session → redirect to /admin/login, remembering the page
 * - /api/admin/*  no session → 401 JSON
 * - /admin/login  always allowed; the page itself sends a signed-in admin on
 */

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const signedIn = Boolean(req.auth?.user?.id);

  if (pathname === "/admin/login") return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    if (signedIn) return NextResponse.next();
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!signedIn) {
    const login = new URL("/admin/login", req.nextUrl.origin);
    login.searchParams.set("from", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
