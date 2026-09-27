"use client";

import { useState, useTransition } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { submitContactAction } from "@/app/(site)/contact/actions";
import { needOptions } from "@/lib/content/home";

type Props = {
  timestampToken: string;
};

export function ContactForm({ timestampToken }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [need, setNeed] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await submitContactAction({
        name,
        email,
        business,
        need,
        message,
        honeypot,
        timestampToken,
      });

      if (res.success) {
        setStatus("success");
        setFeedback(
          res.message ||
            "Thank you. Your message has been received. I will get back to you within 24 hours.",
        );
        setName("");
        setEmail("");
        setBusiness("");
        setNeed("");
        setMessage("");
      } else {
        setStatus("error");
        setFeedback(res.error || "Something went wrong. Please try again.");
      }
    });
  };

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4 rounded-card border border-border bg-[#F7F9FF] p-8 sm:p-10 shadow-card">
        <div className="flex size-11 items-center justify-center rounded-full bg-[#E6F5ED] text-[#1A7F4B]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-h3 font-bold text-ink">Message sent</h3>
        <p className="text-body leading-[1.75] text-ink-body">
          {feedback}
        </p>
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setStatus("idle");
              setFeedback(null);
            }}
          >
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Contact form"
      className="flex flex-col gap-4 rounded-card border border-border bg-[#F7F9FF] p-8 sm:p-10 shadow-card"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-[22px] font-bold text-ink">Tell me about the project</h3>
      </div>

      {status === "error" && feedback && (
        <div className="rounded-input bg-danger-soft p-3.5 text-small text-danger-ink">
          {feedback}
        </div>
      )}

      {/* Honeypot field - invisible to real users */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-hp">Leave this empty</label>
        <input
          id="contact-hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-form-name" className="text-[13px] font-semibold text-[#4A5573]">
            Full name
          </label>
          <Input
            id="contact-form-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-form-email" className="text-[13px] font-semibold text-[#4A5573]">
            Email address
          </label>
          <Input
            id="contact-form-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-form-business" className="text-[13px] font-semibold text-[#4A5573]">
            Business name
          </label>
          <Input
            id="contact-form-business"
            name="business"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="Your business"
            autoComplete="organization"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-form-need" className="text-[13px] font-semibold text-[#4A5573]">
            What do you need?
          </label>
          <Select
            id="contact-form-need"
            name="need"
            value={need}
            onChange={(e) => setNeed(e.target.value)}
          >
            <option value="" disabled>
              Choose one
            </option>
            {needOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-form-message" className="text-[13px] font-semibold text-[#4A5573]">
          Tell me about the problem
        </label>
        <Textarea
          id="contact-form-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What is taking too long, costing too much, or going wrong? Plain words are fine."
          className="h-[140px] text-[14px]"
          required
        />
      </div>

      <div className="pt-1">
        <Button type="submit" block disabled={isPending}>
          {isPending ? "Sending message..." : "Send message"}
        </Button>
      </div>

      <p className="text-center text-[12px] leading-[1.6] text-muted">
        Your details go to me and nowhere else. No list, no follow-up you did not ask for.
      </p>
    </form>
  );
}
