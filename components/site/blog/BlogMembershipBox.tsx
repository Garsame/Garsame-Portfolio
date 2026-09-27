"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { joinMembershipAction } from "@/app/(site)/membership/actions";

export function BlogMembershipBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setFeedback(null);
    startTransition(async () => {
      const ts = Date.now().toString();
      const res = await joinMembershipAction({
        firstName: "Reader",
        email,
        source: "blog",
        timestampToken: `${ts}.direct_blog_submit`,
      });

      if (res.success) {
        setStatus("success");
        setFeedback(res.message || "You're in! Check your email.");
        setEmail("");
      } else {
        setStatus("error");
        setFeedback(res.error || "Could not join.");
      }
    });
  };

  if (status === "success") {
    return (
      <div className="flex flex-col gap-2.5 rounded-card bg-ink p-6.5 text-white shadow-card">
        <span className="font-mono text-[10px] tracking-[0.12em] text-blue-light uppercase">
          {"// MEMBERSHIP"}
        </span>
        <h3 className="text-[18px] font-bold text-white leading-[1.3]">
          You&apos;re on the list
        </h3>
        <p className="text-caption leading-[1.65] text-[#96A1C4]">
          {feedback}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-card bg-ink p-6.5 text-white shadow-card">
      <span className="font-mono text-[10px] tracking-[0.12em] text-blue-light uppercase">
        {"// MEMBERSHIP"}
      </span>
      <h3 className="text-[19px] font-bold text-white leading-[1.35]">
        Get new writing first
      </h3>
      <p className="text-caption leading-[1.65] text-[#96A1C4]">
        Members hear about new articles and new systems before anyone else.
      </p>

      {status === "error" && feedback && (
        <p className="text-fine text-[#FF9B94]">{feedback}</p>
      )}

      <form onSubmit={handleJoin} className="mt-1 flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          aria-label="Email address"
          required
          className="rounded-input bg-white px-3.5 py-2.5 text-small text-ink placeholder:text-muted focus:outline-none"
        />
        <Button type="submit" size="sm" block disabled={isPending}>
          {isPending ? "Joining..." : "Join"}
        </Button>
      </form>
    </div>
  );
}
