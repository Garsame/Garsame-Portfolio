import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { trackPageView } from "@/lib/stats/tracker";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get("g_sid")?.value;

    let shouldSetCookie = false;
    if (!sessionId) {
      sessionId = randomBytes(16).toString("hex");
      shouldSetCookie = true;
    }

    const userAgent = request.headers.get("user-agent");
    const body = (await request.json().catch(() => ({}))) as {
      path?: string;
      referrer?: string;
    };

    const path = typeof body.path === "string" ? body.path : "/";
    const referrer = typeof body.referrer === "string" ? body.referrer : undefined;

    await trackPageView({
      path,
      referrer,
      userAgent,
      sessionId,
    });

    const response = NextResponse.json({ ok: true });

    if (shouldSetCookie) {
      response.cookies.set("g_sid", sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (err) {
    console.error("[api:stats:track]", err);
    return NextResponse.json({ ok: false }, { status: 200 }); // Never crash client beacon
  }
}
