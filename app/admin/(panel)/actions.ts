"use server";

import { signOut } from "@/auth";

/** Clears the session cookie and returns to the sign-in page. */
export async function signOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
