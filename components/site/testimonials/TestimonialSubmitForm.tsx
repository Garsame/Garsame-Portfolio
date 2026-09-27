"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Button, Checkbox, Input, Textarea } from "@/components/ui";
import {
  submitTestimonialAction,
  uploadTestimonialPhotoAction,
} from "@/app/(site)/testimonials/actions";

const TESTIMONIAL_QUOTE_MAX = 600;

type Props = {
  timestampToken: string;
};

export function TestimonialSubmitForm({ timestampToken }: Props) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [quote, setQuote] = useState("");
  const [consent, setConsent] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append("file", file);

    const res = await uploadTestimonialPhotoAction(fd);
    setUploadingPhoto(false);

    if (res.success && res.file) {
      setPhotoId(res.file.id);
      setPhotoUrl(res.file.url);
    } else {
      alert(res.error || "Failed to upload photo.");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!consent) {
      setStatus("error");
      setFeedback("Please check the consent box to allow publishing.");
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await submitTestimonialAction({
        name,
        role,
        business,
        email,
        quote,
        consent,
        photoId,
        honeypot,
        timestampToken,
      });

      if (res.success) {
        setStatus("success");
        setFeedback(
          res.message ||
            "Thank you for writing this. I read every submission personally before it appears on the site.",
        );
        setName("");
        setRole("");
        setBusiness("");
        setEmail("");
        setQuote("");
        setConsent(false);
        setPhotoId(null);
        setPhotoUrl(null);
      } else {
        setStatus("error");
        setFeedback(res.error || "Could not submit testimonial.");
      }
    });
  };

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4 rounded-card bg-white p-8 sm:p-9 shadow-card">
        <div className="flex size-11 items-center justify-center rounded-full bg-[#E6F5ED] text-[#1A7F4B]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-h3 font-bold text-ink">Testimonial received</h3>
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
            Submit another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Testimonial submission form"
      className="flex flex-col gap-3.5 rounded-card bg-white p-8 sm:p-9 shadow-card"
    >
      <h3 className="text-[21px] font-bold text-ink">Submit your testimonial</h3>

      {status === "error" && feedback && (
        <div className="rounded-input bg-danger-soft p-3 text-small text-danger-ink">
          {feedback}
        </div>
      )}

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="test-hp">Leave this empty</label>
        <input
          id="test-hp"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="test-name" className="text-[13px] font-semibold text-[#4A5573]">
            Your name
          </label>
          <Input
            id="test-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            tone="field"
            placeholder="Full name"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="test-role" className="text-[13px] font-semibold text-[#4A5573]">
            Your role
          </label>
          <Input
            id="test-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            tone="field"
            placeholder="e.g. Operations Manager"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="test-biz" className="text-[13px] font-semibold text-[#4A5573]">
            Business
          </label>
          <Input
            id="test-biz"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            tone="field"
            placeholder="Company name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="test-email" className="text-[13px] font-semibold text-[#4A5573]">
            Email <span className="font-normal text-muted">(private)</span>
          </label>
          <Input
            id="test-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            tone="field"
            placeholder="you@company.com"
            required
          />
        </div>
      </div>

      {/* Photo upload dropzone */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-[#4A5573]">
          Photo <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        {photoUrl ? (
          <div className="flex items-center gap-3 rounded-card border border-border bg-tint p-3">
            <div className="relative size-12 overflow-hidden rounded-full border border-border">
              <Image src={photoUrl} alt="Preview" fill className="object-cover" />
            </div>
            <span className="text-small text-ink">Photo attached</span>
            <button
              type="button"
              onClick={() => {
                setPhotoId(null);
                setPhotoUrl(null);
              }}
              className="ml-auto text-caption text-danger hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="flex flex-col items-center justify-center rounded-card border border-dashed border-[#C9D2F7] bg-tint p-4.5 text-center text-small text-muted transition-colors hover:border-blue hover:text-blue"
          >
            {uploadingPhoto
              ? "Uploading photo..."
              : "Drop a photo here, or click to choose"}
          </button>
        )}
      </div>

      {/* Testimonial Quote */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="test-quote" className="text-[13px] font-semibold text-[#4A5573]">
          Your testimonial
        </label>
        <Textarea
          id="test-quote"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          tone="field"
          placeholder="What did we build, and what changed for you?"
          className="h-[120px] text-[14px]"
          maxLength={TESTIMONIAL_QUOTE_MAX}
          required
        />
        <span className="font-mono text-[11px] text-muted self-end">
          {quote.length} / {TESTIMONIAL_QUOTE_MAX}
        </span>
      </div>

      {/* Consent Checkbox */}
      <div className="pt-1">
        <Checkbox
          id="test-consent"
          label="I am happy for this to be published on the site with my name and business."
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
      </div>

      <div className="pt-2">
        <Button type="submit" block disabled={isPending || uploadingPhoto}>
          {isPending ? "Sending..." : "Send it to Garsame"}
        </Button>
      </div>
    </form>
  );
}
