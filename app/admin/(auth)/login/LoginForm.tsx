"use client";

import { useActionState, useState } from "react";
import { Button, FormField, Input } from "@/components/ui";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/admin/icons";
import { login, type LoginState } from "./actions";

/**
 * design/20-admin-login.html. The fields, the show-password toggle and the
 * lockout notice.
 *
 * Errors never say whether it was the email or the password that was wrong —
 * that would tell a stranger which email is the admin's.
 */

const MESSAGES: Record<NonNullable<LoginState["error"]>, string> = {
  missing: "Enter your email and password.",
  invalid: "That email and password do not match.",
  locked:
    "Too many failed attempts. Sign-in is locked for fifteen minutes from the last one.",
  unknown: "Something went wrong signing in. Try again.",
};

export function LoginForm({
  from,
  expired,
}: {
  from: string;
  expired: boolean;
}) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    {},
  );
  const [showPassword, setShowPassword] = useState(false);

  const message = state.error
    ? MESSAGES[state.error]
    : expired
      ? "Your session has ended. Sign in again."
      : null;

  return (
    <form action={action} className="flex flex-col gap-5.5" noValidate>
      <input type="hidden" name="from" value={from} />

      <div className="flex flex-col gap-3.5 pt-1">
        <FormField label="Email" htmlFor="login-email">
          {/* Re-keyed per attempt: React resets a form after its action runs,
              and this puts the email back while the password stays cleared. */}
          <Input
            key={`email-${state.attempt ?? 0}`}
            id="login-email"
            name="email"
            type="email"
            tone="field"
            autoComplete="username"
            defaultValue={state.email}
            required
            autoFocus={!state.email}
          />
        </FormField>

        <FormField label="Password" htmlFor="login-password">
          <div className="relative">
            <Input
              key={`password-${state.attempt ?? 0}`}
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              tone="field"
              autoComplete="current-password"
              className="pr-12"
              required
              autoFocus={Boolean(state.email)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-input text-muted transition-button hover:text-ink-2"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </FormField>
      </div>

      {message ? (
        <p
          role="alert"
          className={
            state.error
              ? "rounded-input bg-danger-bg px-3.5 py-3 text-caption text-danger-ink"
              : "rounded-input bg-accent-soft px-3.5 py-3 text-caption text-accent-ink"
          }
        >
          {message}
        </p>
      ) : null}

      <Button type="submit" block disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <div className="flex items-center gap-2.25 rounded-input border border-border bg-field px-3.5 py-3">
        <LockIcon className="shrink-0 text-muted" />
        <span className="text-fine text-ink-body">
          Five failed attempts locks this page for fifteen minutes.
        </span>
      </div>
    </form>
  );
}
