import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/ui";
import { adminOrNull } from "@/lib/dal";
import { LoginForm } from "./LoginForm";

/**
 * /admin/login — design/20-admin-login.html.
 *
 * An admin with a valid session is sent straight to the dashboard. The check
 * is the full one from lib/dal.ts, not a cookie peek: a session that exists but
 * is no longer valid — signed in before a password change — gets the form, not
 * a redirect loop between here and /admin.
 */

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ from?: string; expired?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  if (await adminOrNull()) redirect("/admin");

  const { from = "/admin", expired } = await searchParams;

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-ink px-4 py-16">
      {/* Decorative circles — design/20-admin-login.html */}
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-35 size-130 rounded-full bg-ink-deep"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-15 size-90 rounded-full bg-ink-deep-2"
      />
      <div
        aria-hidden="true"
        className="absolute -top-35 -right-30 size-110 rounded-full bg-ink-deep"
      />

      <div className="relative flex w-full max-w-login flex-col gap-5.5 rounded-card bg-white px-6 py-9 sm:px-10 sm:py-11">
        <div className="flex justify-center">
          <Wordmark href={null} />
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-h3 text-ink">Sign in</h1>
          <p className="text-small text-ink-body">Admin access only</p>
        </div>

        <LoginForm from={from} expired={expired === "1"} />
      </div>

      <p className="absolute bottom-7 font-mono text-mono-meta font-regular tracking-wide text-on-ink-faint">
        GARSAME v3 · ADMIN
      </p>
    </main>
  );
}
