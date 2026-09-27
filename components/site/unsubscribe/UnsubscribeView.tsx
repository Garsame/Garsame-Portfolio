"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { resubscribeAction } from "@/app/(site)/unsubscribe/actions";

type Props = {
  token: string;
  initialStatus: "success" | "invalid" | "missing";
  memberName?: string;
  memberEmail?: string;
};

export function UnsubscribeView({
  token,
  initialStatus,
  memberName,
  memberEmail,
}: Props) {
  const [resubscribed, setResubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleResubscribe = () => {
    startTransition(async () => {
      const res = await resubscribeAction(token);
      if (res.success) {
        setResubscribed(true);
      }
    });
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[500px] rounded-card border border-border bg-white p-8 shadow-card sm:p-10">
        <div className="flex flex-col gap-5">
          <span className="font-mono text-mono-meta text-muted uppercase">
            {"// Membership"}
          </span>

          {initialStatus === "success" && !resubscribed && (
            <>
              <h1 className="text-h2 font-extrabold tracking-tight text-ink">
                You have been unsubscribed
              </h1>
              <p className="text-body leading-[1.7] text-ink-body">
                {memberName ? `Goodbye, ${memberName}. ` : ""}
                You will no longer receive update emails at{" "}
                <span className="font-semibold text-ink">{memberEmail}</span>.
              </p>
              <div className="mt-2 flex flex-col gap-3 pt-3 border-t border-border-soft">
                <p className="text-caption text-muted">
                  Clicked by mistake? You can rejoin anytime.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResubscribe}
                    disabled={isPending}
                  >
                    {isPending ? "Re-subscribing..." : "Re-subscribe"}
                  </Button>
                  <Button href="/" variant="ghost" size="sm">
                    Back to Home
                  </Button>
                </div>
              </div>
            </>
          )}

          {resubscribed && (
            <>
              <h1 className="text-h2 font-extrabold tracking-tight text-ink">
                Welcome back!
              </h1>
              <p className="text-body leading-[1.7] text-ink-body">
                Your subscription has been reactivated for{" "}
                <span className="font-semibold text-ink">{memberEmail}</span>.
              </p>
              <div className="pt-3">
                <Button href="/" size="sm">
                  Return to Home
                </Button>
              </div>
            </>
          )}

          {initialStatus !== "success" && !resubscribed && (
            <>
              <h1 className="text-h2 font-extrabold tracking-tight text-ink">
                Subscription link not found
              </h1>
              <p className="text-body leading-[1.7] text-ink-body">
                This unsubscribe link appears to be invalid or has expired. If you need assistance, please contact me directly.
              </p>
              <div className="pt-3 flex gap-3">
                <Button href="/" variant="secondary" size="sm">
                  Home
                </Button>
                <Button href="/contact" variant="ghost" size="sm">
                  Contact
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
