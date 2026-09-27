"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";
import { joinMembershipAction } from "@/app/(site)/membership/actions";

export type MemberSource = "home" | "membership" | "blog" | "footer";

type Props = {
  timestampToken: string;
  source?: MemberSource;
};

export function MembershipJoinForm({
  timestampToken,
  source = "membership",
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await joinMembershipAction({
        firstName,
        lastName,
        email,
        source,
        honeypot,
        timestampToken,
      });

      if (res.success) {
        setStatus("success");
        setFeedback(res.message || "You're in! Check your inbox for a welcome note.");
        setFirstName("");
        setLastName("");
        setEmail("");
      } else {
        setStatus("error");
        setFeedback(res.error || "Failed to join. Please try again.");
      }
    });
  };

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4 rounded-card border border-border bg-white p-8 sm:p-9 shadow-card">
        <div className="flex size-11 items-center justify-center rounded-full bg-[#E6F5ED] text-[#1A7F4B]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-h3 font-bold text-ink">Welcome to the membership</h3>
        <p className="text-body leading-[1.7] text-ink-body">
          {feedback}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Membership join form"
      className="flex flex-col gap-3.5 rounded-card border border-border bg-white p-8 sm:p-9 shadow-[0_8px_30px_rgba(14,21,51,0.06)]"
    >
      <h3 className="text-[22px] font-bold text-ink">Become a member</h3>

      {status === "error" && feedback && (
        <div className="rounded-input bg-danger-soft p-3 text-small text-danger-ink">
          {feedback}
        </div>
      )}

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="member-hp">Leave this empty</label>
        <input
          id="member-hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="member-first-name" className="text-[13px] font-semibold text-[#4A5573]">
            First name
          </label>
          <Input
            id="member-first-name"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            tone="field"
            placeholder="Your first name"
            autoComplete="given-name"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="member-last-name" className="text-[13px] font-semibold text-[#4A5573]">
            Last name
          </label>
          <Input
            id="member-last-name"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            tone="field"
            placeholder="Your last name"
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="member-email-addr" className="text-[13px] font-semibold text-[#4A5573]">
          Email address
        </label>
        <Input
          id="member-email-addr"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          tone="field"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="pt-1">
        <Button type="submit" block disabled={isPending}>
          {isPending ? "Joining..." : "Join"}
        </Button>
      </div>

      <p className="text-center text-[12px] leading-[1.6] text-muted">
        One message at a time, never a flood. Leave with one click.
      </p>
    </form>
  );
}
