"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { POST_TEMPLATES, type PostTemplateKey } from "@/lib/blog-templates";

export function TemplateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!open) return null;

  const selectTemplate = (key: PostTemplateKey) => {
    onClose();
    router.push(`/admin/blog/new?template=${key}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-[560px] rounded-card border border-border bg-white p-7 shadow-card animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3 font-bold text-ink">Choose a starting template</h2>
            <p className="text-small text-ink-body">
              Select a pre-structured template or start from a blank page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-input p-1 text-muted hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {POST_TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTemplate(t.key)}
              className="group flex flex-col items-start gap-1.5 rounded-input border border-border bg-field p-4 text-left transition-button hover:border-blue hover:bg-accent-soft active:scale-98"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-body font-bold text-ink group-hover:text-blue">
                  {t.title}
                </span>
                <span className="font-mono text-mono-meta uppercase text-muted">
                  {t.defaultCategory}
                </span>
              </div>
              <p className="text-caption leading-relaxed text-ink-body">
                {t.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
