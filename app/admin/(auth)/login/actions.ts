"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

/**
 * The sign-in form action.
 *
 * Server actions carry Next.js's built-in CSRF protection (the request's
 * Origin must match the host), and the credentials are checked in auth.ts —
 * including the five-attempt lockout — so nothing here trusts the browser.
 */

export type LoginState = {
  error?: "missing" | "invalid" | "locked" | "unknown";
  /** Put back into the email field after a failed attempt. */
  email?: string;
  /** Changes on every attempt, so the form's fields re-mount with it. */
  attempt?: number;
};

/** Only same-site admin paths — never an open redirect to another site. */
function safeDestination(from: string): string {
  if (!/^\/admin(?:[/?#]|$)/.test(from)) return "/admin";
  if (from.startsWith("/admin/login")) return "/admin";
  if (from.includes("\\") || from.startsWith("//")) return "/admin";
  return from;
}

export async function login(
  previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const attempt = (previous.attempt ?? 0) + 1;

  if (!email || !password) return { error: "missing", email, attempt };

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeDestination(String(formData.get("from") ?? "")),
    });
  } catch (error) {
    /* A successful sign-in throws Next's redirect, which must be re-thrown so
       it happens. Only Auth.js errors are failures. */
    if (error instanceof AuthError) {
      const code = (error as AuthError & { code?: string }).code;
      if (code === "locked") return { error: "locked", email, attempt };
      if (error.type === "CredentialsSignin") {
        return { error: "invalid", email, attempt };
      }
      return { error: "unknown", email, attempt };
    }
    throw error;
  }

  return { attempt };
}
