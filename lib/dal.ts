import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models";

/**
 * The data access layer's auth check — the real one.
 *
 * proxy.ts only confirms a session cookie exists. This confirms, on every
 * admin page render and every admin API call, that:
 *
 *   1. the session decodes and names a user,
 *   2. that user still exists in the database, and
 *   3. the session was signed in AFTER the account last changed — so resetting
 *      the password (npm run db:seed -- --reset-admin-password) signs out every
 *      session that existed before, including a stolen one. D-062.
 *
 * Call it in every admin page and at the top of every admin data function,
 * next to the data rather than in the layout: the Next.js 16 docs point out
 * that a layout does not re-run on navigation and does not stop the page under
 * it from rendering.
 *
 * `cache` means one database lookup per request however many components ask.
 */

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
};

const loadAdmin = cache(async (): Promise<AdminUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || typeof session.authTime !== "number") return null;

  await dbConnect();
  const user = await User.findById(id)
    .select("email name updatedAt")
    .lean<{ _id: unknown; email: string; name?: string; updatedAt: Date }>()
    .catch(() => null);
  if (!user) return null;

  /* A session signed in before the account's last change is not trusted. */
  if (user.updatedAt.getTime() > session.authTime * 1000) return null;

  return { id: String(user._id), email: user.email, name: user.name ?? null };
});

/** For admin pages: the admin, or a redirect to the sign-in page. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await loadAdmin();
  if (!admin) redirect("/admin/login?expired=1");
  return admin;
}

/** For admin API route handlers: the admin, or null — answer 401 on null. */
export async function adminOrNull(): Promise<AdminUser | null> {
  return loadAdmin();
}
