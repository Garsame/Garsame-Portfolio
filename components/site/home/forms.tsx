"use client";

import { useState, useTransition } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { membership, needOptions } from "@/lib/content/home";
import { joinMembershipAction } from "@/app/(site)/membership/actions";
import { submitContactAction } from "@/app/(site)/contact/actions";

/* ------------------------------------------------------------ membership */

export function MembershipForm() {
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
      // Dynamic timestamp token generated on submit for inline form
      const ts = Date.now().toString();
      const res = await joinMembershipAction({
        firstName,
        lastName,
        email,
        source: "home",
        honeypot,
        timestampToken: `${ts}.direct_home_submit`,
      });

      if (res.success) {
        setStatus("success");
        setFeedback(res.message || "You're in! Check your inbox for a welcome note.");
        setFirstName("");
        setLastName("");
        setEmail("");
      } else {
        setStatus("error");
        setFeedback(res.error || "Could not complete signup.");
      }
    });
  };

  if (status === "success") {
    return (
      <div className="flex flex-col gap-3 rounded-card bg-white p-7.5 shadow-card">
        <div className="flex size-9 items-center justify-center rounded-full bg-[#E6F5ED] text-[#1A7F4B]">
          ✓
        </div>
        <h3 className="text-h3 text-ink">Welcome to the membership</h3>
        <p className="text-caption leading-[1.6] text-ink-body">
          {feedback}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="membership-form-title"
      className="flex flex-col gap-3.25 rounded-card bg-white p-7.5 shadow-card"
    >
      <h3 id="membership-form-title" className="mb-0.5 text-h3 text-ink">
        {membership.formTitle}
      </h3>

      {status === "error" && feedback && (
        <p role="alert" className="rounded-input bg-danger-soft p-2.5 text-caption text-danger-ink">
          {feedback}
        </p>
      )}

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="home-member-hp">Leave empty</label>
        <input
          id="home-member-hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid gap-2.75 sm:grid-cols-2">
        <div>
          <label htmlFor="member-first" className="sr-only">
            First name
          </label>
          <Input
            id="member-first"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            tone="field"
            placeholder="First name"
            autoComplete="given-name"
            required
          />
        </div>
        <div>
          <label htmlFor="member-last" className="sr-only">
            Last name
          </label>
          <Input
            id="member-last"
            name="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            tone="field"
            placeholder="Last name"
            autoComplete="family-name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="member-email" className="sr-only">
          Email address
        </label>
        <Input
          id="member-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          tone="field"
          placeholder="Email address"
          autoComplete="email"
          required
        />
      </div>

      <Button type="submit" block disabled={isPending}>
        {isPending ? "Joining..." : "Join"}
      </Button>

      <p className="text-center text-fine text-muted">
        {membership.reassurance}
      </p>
    </form>
  );
}

/* --------------------------------------------------------------- contact */

export function ContactForm() {
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
      const ts = Date.now().toString();
      const res = await submitContactAction({
        name,
        email,
        business,
        need,
        message,
        honeypot,
        timestampToken: `${ts}.direct_home_submit`,
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
        setFeedback(res.error || "Could not send message.");
      }
    });
  };

  if (status === "success") {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-border bg-tint-soft p-6 sm:p-8">
        <div className="flex size-9 items-center justify-center rounded-full bg-[#E6F5ED] text-[#1A7F4B]">
          ✓
        </div>
        <h3 className="text-h3 text-ink">Message sent</h3>
        <p className="text-caption leading-[1.6] text-ink-body">
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
            Send another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Enquiry"
      className="flex flex-col gap-3.25 rounded-card border border-border bg-tint-soft p-6 sm:p-8"
    >
      {status === "error" && feedback && (
        <p role="alert" className="rounded-input bg-danger-soft p-2.5 text-caption text-danger-ink">
          {feedback}
        </p>
      )}

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="home-contact-hp">Leave empty</label>
        <input
          id="home-contact-hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid gap-2.75 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="sr-only">
            Full name
          </label>
          <Input
            id="contact-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="sr-only">
            Email address
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="grid gap-2.75 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-business" className="sr-only">
            Business name
          </label>
          <Input
            id="contact-business"
            name="business"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="Business name"
            autoComplete="organization"
          />
        </div>
        <div>
          <label htmlFor="contact-need" className="sr-only">
            What do you need?
          </label>
          <Select
            id="contact-need"
            name="need"
            value={need}
            onChange={(e) => setNeed(e.target.value)}
          >
            <option value="" disabled>
              What do you need?
            </option>
            {needOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="sr-only">
          Tell me about the problem
        </label>
        <Textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell me about the problem"
          className="h-textarea"
          required
        />
      </div>

      <Button type="submit" block disabled={isPending}>
        {isPending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
