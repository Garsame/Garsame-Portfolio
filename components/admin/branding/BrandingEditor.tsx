"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { saveBrandingAction } from "@/app/admin/(panel)/branding/actions";
import type { BrandingView } from "@/lib/admin/branding";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { LockIcon, TrashIcon } from "../icons";

type Props = {
  initialData: BrandingView;
};

export function BrandingEditor({ initialData }: Props) {
  const [data, setData] = useState<BrandingView>(initialData);
  const [newRotatingWord, setNewRotatingWord] = useState("");
  const [addingWord, setAddingWord] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Media picker states
  const [pickerTarget, setPickerTarget] = useState<
    "logo" | "heroPortrait" | "breakImage" | "cvFile" | "socialImage" | null
  >(null);

  const handleSave = () => {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const payload = {
        logoId: data.logo?.id ?? null,
        availability: data.availability,
        availabilityText: data.availabilityText,
        heroHeadingLine1: data.heroHeadingLine1,
        heroHeadingLine2Prefix: data.heroHeadingLine2Prefix,
        heroRotatingWords: data.heroRotatingWords,
        heroParagraph: data.heroParagraph,
        heroPortraitId: data.heroPortrait?.id ?? null,
        breakImageId: data.breakImage?.id ?? null,
        heroBadges: data.heroBadges,
        socialLinks: data.socialLinks,
        cvFileId: data.cvFile?.id ?? null,
        metaDescription: data.metaDescription,
        socialImageId: data.socialImage?.id ?? null,
      };

      const res = await saveBrandingAction(payload);
      if (!res.success) {
        setError(res.error || "Could not save branding settings.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  const addRotatingWord = () => {
    if (!newRotatingWord.trim()) return;
    setData((prev) => ({
      ...prev,
      heroRotatingWords: [...prev.heroRotatingWords, newRotatingWord.trim()],
    }));
    setNewRotatingWord("");
    setAddingWord(false);
  };

  const removeRotatingWord = (index: number) => {
    setData((prev) => ({
      ...prev,
      heroRotatingWords: prev.heroRotatingWords.filter((_, i) => i !== index),
    }));
  };

  const updateBadge = (
    index: number,
    field: "label" | "value" | "tone",
    val: string,
  ) => {
    setData((prev) => {
      const nextBadges = [...prev.heroBadges];
      nextBadges[index] = { ...nextBadges[index], [field]: val };
      return { ...prev, heroBadges: nextBadges };
    });
  };

  const addSocialLink = () => {
    setData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: "Platform", url: "https://" }],
    }));
  };

  const updateSocialLink = (
    index: number,
    field: "platform" | "url",
    val: string,
  ) => {
    setData((prev) => {
      const nextLinks = [...prev.socialLinks];
      nextLinks[index] = { ...nextLinks[index], [field]: val };
      return { ...prev, socialLinks: nextLinks };
    });
  };

  const removeSocialLink = (index: number) => {
    setData((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-7">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-display-sm font-bold text-ink">Branding &amp; Look</h1>
          <span className="font-mono text-caption text-muted">
            everything visible on the site, except the colours
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="rounded-card border border-border bg-white px-4 py-2 text-small font-semibold text-ink transition hover:border-blue hover:text-blue"
          >
            Preview home page ↗
          </Link>
          <Button variant="primary" size="md" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : saved ? "Saved!" : "Save changes"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-card border border-red-200 bg-red-50 p-4 text-small text-red-600">
          {error}
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main Column */}
        <div className="flex flex-col gap-6">
          {/* Identity Card */}
          <div className="flex flex-col gap-4 rounded-card border border-border bg-white p-6 shadow-card">
            <h2 className="text-body font-bold text-ink">Identity</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Logo */}
              <div className="flex flex-col gap-2">
                <label className="text-caption font-semibold text-ink-muted">Logo</label>
                <div className="flex items-center justify-between rounded-lg border border-dashed border-[#C9D2F7] bg-[#F8FAFF] p-3.5">
                  {data.logo ? (
                    <div className="flex items-center gap-3">
                      <div className="relative h-7 w-20">
                        <Image
                          src={data.logo.url}
                          alt="Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="font-mono text-caption text-ink truncate max-w-[100px]">
                        {data.logo.originalName}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-body font-extrabold tracking-tight text-ink">
                        GARSAME
                      </span>
                      <span className="bg-blue font-mono text-[9px] font-semibold text-white px-1.5 py-0.5 rounded-[2px]">
                        v3
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerTarget("logo")}
                      className="font-mono text-caption font-medium text-blue hover:underline"
                    >
                      {data.logo ? "Change" : "Upload logo"}
                    </button>
                    {data.logo && (
                      <button
                        type="button"
                        onClick={() => setData((p) => ({ ...p, logo: null }))}
                        className="text-muted hover:text-red-600"
                        title="Reset to wordmark"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {!data.logo && (
                      <span className="font-mono text-[10px] text-muted">using the wordmark</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Availability Status */}
              <div className="flex flex-col gap-2">
                <label className="text-caption font-semibold text-ink-muted">
                  Availability status
                </label>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-[#F8FAFF] p-2.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      data.availability === "available"
                        ? "bg-success"
                        : data.availability === "limited"
                        ? "bg-warning"
                        : "bg-ink-body"
                    }`}
                  />
                  <select
                    value={data.availability}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        availability: e.target.value as BrandingView["availability"],
                      }))
                    }
                    className="flex-1 bg-transparent text-small font-medium text-ink focus:outline-none"
                  >
                    <option value="available">Available for new work</option>
                    <option value="limited">Limited availability</option>
                    <option value="booked">Booked out</option>
                  </select>
                </div>
                <Input
                  value={data.availabilityText}
                  onChange={(e) =>
                    setData((p) => ({ ...p, availabilityText: e.target.value }))
                  }
                  placeholder="AVAILABLE FOR WORK"
                  className="text-caption"
                />
              </div>
            </div>
          </div>

          {/* Hero Card */}
          <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-6 shadow-card">
            <h2 className="text-body font-bold text-ink">Hero</h2>

            {/* Headings */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-semibold text-ink-muted">
                  Heading, line one
                </label>
                <Input
                  value={data.heroHeadingLine1}
                  onChange={(e) =>
                    setData((p) => ({ ...p, heroHeadingLine1: e.target.value }))
                  }
                  placeholder="I build the system"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-semibold text-ink-muted">
                  Heading, line two before the rotating word
                </label>
                <Input
                  value={data.heroHeadingLine2Prefix}
                  onChange={(e) =>
                    setData((p) => ({
                      ...p,
                      heroHeadingLine2Prefix: e.target.value,
                    }))
                  }
                  placeholder="your business"
                />
              </div>
            </div>

            {/* Rotating Words */}
            <div className="flex flex-col gap-2">
              <label className="text-caption font-semibold text-ink-muted">
                Rotating words
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {data.heroRotatingWords.map((word, idx) => (
                  <span
                    key={`${word}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#EDF0FE] px-3 py-1.5 font-mono text-small text-blue"
                  >
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => removeRotatingWord(idx)}
                      className="text-blue/70 hover:text-blue"
                      title="Remove word"
                    >
                      ×
                    </button>
                  </span>
                ))}

                {addingWord ? (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      value={newRotatingWord}
                      onChange={(e) => setNewRotatingWord(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRotatingWord();
                        } else if (e.key === "Escape") {
                          setAddingWord(false);
                        }
                      }}
                      placeholder="new word..."
                      className="rounded border border-blue bg-white px-2 py-1 font-mono text-small focus:outline-none"
                    />
                    <Button variant="primary" size="sm" onClick={addRotatingWord}>
                      Add
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingWord(true)}
                    className="rounded-md border border-dashed border-[#C9D2F7] px-3 py-1.5 font-mono text-small text-muted hover:border-blue hover:text-blue"
                  >
                    + add
                  </button>
                )}
              </div>
            </div>

            {/* Paragraph */}
            <div className="flex flex-col gap-1.5">
              <label className="text-caption font-semibold text-ink-muted">
                Paragraph
              </label>
              <Textarea
                rows={3}
                value={data.heroParagraph}
                onChange={(e) =>
                  setData((p) => ({ ...p, heroParagraph: e.target.value }))
                }
                placeholder="Hero lead paragraph..."
              />
            </div>

            {/* Portrait and Break Image */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Portrait */}
              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-semibold text-ink-muted">
                  Portrait
                </label>
                <div className="flex items-center justify-between rounded-lg border border-border bg-[#F8FAFF] p-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-8 overflow-hidden rounded bg-[#EDF0FE]">
                      {data.heroPortrait ? (
                        <Image
                          src={data.heroPortrait.url}
                          alt="Portrait"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-tint" />
                      )}
                    </div>
                    <span className="font-mono text-caption text-ink-muted truncate max-w-[120px]">
                      {data.heroPortrait ? data.heroPortrait.originalName : "Default portrait"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerTarget("heroPortrait")}
                      className="font-mono text-caption font-medium text-blue hover:underline"
                    >
                      {data.heroPortrait ? "Change" : "Choose"}
                    </button>
                    {data.heroPortrait && (
                      <button
                        type="button"
                        onClick={() => setData((p) => ({ ...p, heroPortrait: null }))}
                        className="text-muted hover:text-red-600"
                        title="Reset"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Break Image */}
              <div className="flex flex-col gap-1.5">
                <label className="text-caption font-semibold text-ink-muted">
                  Full-width break image
                </label>
                <div className="flex items-center justify-between rounded-lg border border-border bg-[#F8FAFF] p-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-14 overflow-hidden rounded bg-[#EDF0FE]">
                      {data.breakImage ? (
                        <Image
                          src={data.breakImage.url}
                          alt="Break image"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-tint" />
                      )}
                    </div>
                    <span className="font-mono text-caption text-ink-muted truncate max-w-[120px]">
                      {data.breakImage ? data.breakImage.originalName : "Default break image"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerTarget("breakImage")}
                      className="font-mono text-caption font-medium text-blue hover:underline"
                    >
                      {data.breakImage ? "Change" : "Choose"}
                    </button>
                    {data.breakImage && (
                      <button
                        type="button"
                        onClick={() => setData((p) => ({ ...p, breakImage: null }))}
                        className="text-muted hover:text-red-600"
                        title="Reset"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three Hero Badges Card */}
          <div className="flex flex-col gap-4 rounded-card border border-border bg-white p-6 shadow-card">
            <h2 className="text-body font-bold text-ink">The three hero badges</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {data.heroBadges.map((badge, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2.5 rounded-lg border border-border p-3.5 bg-white"
                >
                  <span className="font-mono text-[10px] font-semibold text-muted uppercase">
                    BADGE {idx + 1}
                  </span>
                  <Input
                    value={badge.label}
                    onChange={(e) => updateBadge(idx, "label", e.target.value)}
                    placeholder="LABEL"
                    className="text-caption font-mono"
                  />
                  <Input
                    value={badge.value}
                    onChange={(e) => updateBadge(idx, "value", e.target.value)}
                    placeholder="Value text"
                    className="text-caption"
                  />

                  {/* Tone Selector */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updateBadge(idx, "tone", "warning")}
                      title="Warning (bolt)"
                      className={`h-6 w-6 rounded bg-[#FEF3E4] border-2 transition-all ${
                        badge.tone === "warning"
                          ? "border-[#B4690E] scale-110 shadow-xs"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => updateBadge(idx, "tone", "success")}
                      title="Success (check)"
                      className={`h-6 w-6 rounded bg-[#E6F5ED] border-2 transition-all ${
                        badge.tone === "success"
                          ? "border-[#1A7F4B] scale-110 shadow-xs"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => updateBadge(idx, "tone", "accent")}
                      title="Accent (clock)"
                      className={`h-6 w-6 rounded bg-[#EDF0FE] border-2 transition-all ${
                        badge.tone === "accent"
                          ? "border-[#3D5AF1] scale-110 shadow-xs"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Rail Column */}
        <div className="flex flex-col gap-6">
          {/* Colours Are Locked Card */}
          <div className="flex flex-col gap-3 rounded-card bg-[#0E1533] p-5 text-white shadow-card">
            <div className="flex items-center gap-2">
              <LockIcon className="h-4 w-4 text-[#7B90FF]" />
              <span className="text-small font-bold text-white">Colours are locked</span>
            </div>
            <p className="text-caption leading-relaxed text-[#96A1C4]">
              The palette lives in the code where it was designed, so the site cannot be broken from this screen. Changing it is a deploy, not a setting — by your own decision.
            </p>
          </div>

          {/* Social Links Card */}
          <div className="flex flex-col gap-3.5 rounded-card border border-border bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-small font-bold text-ink">Social links</h3>
              <button
                type="button"
                onClick={addSocialLink}
                className="font-mono text-caption text-blue hover:underline"
              >
                + Add link
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {data.socialLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={link.platform}
                    onChange={(e) => updateSocialLink(idx, "platform", e.target.value)}
                    placeholder="Platform"
                    className="w-24 text-caption font-semibold"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateSocialLink(idx, "url", e.target.value)}
                    placeholder="https://..."
                    className="flex-1 text-caption font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => removeSocialLink(idx)}
                    className="text-muted hover:text-red-600"
                    title="Remove link"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CV File Card */}
          <div className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card">
            <h3 className="text-small font-bold text-ink">CV Download File</h3>
            <div className="flex items-center justify-between rounded-lg border border-border bg-[#F8FAFF] p-3">
              <div className="flex items-center gap-2 truncate">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7D89AE" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span className="font-mono text-caption text-ink truncate max-w-[130px]">
                  {data.cvFile ? data.cvFile.originalName : "No CV uploaded"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerTarget("cvFile")}
                  className="font-mono text-caption font-medium text-blue hover:underline"
                >
                  {data.cvFile ? "Change" : "Upload"}
                </button>
                {data.cvFile && (
                  <button
                    type="button"
                    onClick={() => setData((p) => ({ ...p, cvFile: null }))}
                    className="text-muted hover:text-red-600"
                    title="Remove"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Meta & Social Sharing Card */}
          <div className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-small font-bold text-ink">Meta &amp; Sharing</h3>
              <span
                className={`font-mono text-[11px] ${
                  data.metaDescription.length > 160 ? "text-red-600 font-bold" : "text-muted"
                }`}
              >
                {data.metaDescription.length}/160
              </span>
            </div>

            <Textarea
              rows={3}
              value={data.metaDescription}
              onChange={(e) => setData((p) => ({ ...p, metaDescription: e.target.value }))}
              placeholder="SEO meta description..."
              className="text-caption"
            />

            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-caption font-semibold text-ink-muted">
                Social Share Image
              </label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-[#F8FAFF] p-2.5">
                <div className="flex items-center gap-2 truncate">
                  <div className="relative h-6 w-10 overflow-hidden rounded bg-[#EDF0FE]">
                    {data.socialImage && (
                      <Image
                        src={data.socialImage.url}
                        alt="Social Share"
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <span className="font-mono text-caption text-ink-muted truncate max-w-[120px]">
                    {data.socialImage ? data.socialImage.originalName : "Default OG image"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerTarget("socialImage")}
                    className="font-mono text-caption font-medium text-blue hover:underline"
                  >
                    {data.socialImage ? "Change" : "Choose"}
                  </button>
                  {data.socialImage && (
                    <button
                      type="button"
                      onClick={() => setData((p) => ({ ...p, socialImage: null }))}
                      className="text-muted hover:text-red-600"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      {pickerTarget && (
        <MediaPickerModal
          open={true}
          onClose={() => setPickerTarget(null)}
          accept={pickerTarget === "cvFile" ? "documents" : "images"}
          title={
            pickerTarget === "cvFile"
              ? "Select CV Document (PDF)"
              : pickerTarget === "logo"
              ? "Select Site Logo"
              : pickerTarget === "heroPortrait"
              ? "Select Hero Portrait"
              : pickerTarget === "breakImage"
              ? "Select Full-Width Break Image"
              : "Select Social Sharing Image"
          }
          onSelect={(file) => {
            setData((prev) => ({
              ...prev,
              [pickerTarget]: {
                id: file.id,
                url: file.url,
                originalName: file.originalName,
              },
            }));
            setPickerTarget(null);
          }}
        />
      )}
    </div>
  );
}
