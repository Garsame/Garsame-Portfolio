"use client";

import { Button } from "@/components/ui";

export type BroadcastConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subject: string;
  recipientCount: number;
  isSending: boolean;
};

export function BroadcastConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  subject,
  recipientCount,
  isSending,
}: BroadcastConfirmModalProps) {
  if (!isOpen) return null;

  const estMinutes = Math.max(1, Math.ceil(recipientCount / 20));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex w-full max-w-md flex-col rounded-card border border-border bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FBF1E3] text-[#B4690E]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 9v4M12 17v.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <div>
            <h3 className="text-h3 text-ink">Confirm Broadcast</h3>
            <p className="text-small text-ink-body mt-0.5">
              Please verify recipient count before dispatching.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-card bg-[#F8FAFF] border border-border p-4 my-2">
          <div className="flex justify-between text-small">
            <span className="text-muted">Subject</span>
            <span className="font-semibold text-ink truncate max-w-[200px]">
              {subject || "Untitled Update"}
            </span>
          </div>
          <div className="flex justify-between text-small">
            <span className="text-muted">Active Recipients</span>
            <span className="font-mono font-bold text-blue">
              {recipientCount} members
            </span>
          </div>
          <div className="flex justify-between text-small">
            <span className="text-muted">Estimated Delivery</span>
            <span className="font-mono text-ink">
              ~{estMinutes} {estMinutes === 1 ? "minute" : "minutes"} (throttled)
            </span>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-ink-body my-2">
          This broadcast will be dispatched to exactly{" "}
          <strong className="text-ink">{recipientCount} active members</strong>.
          Every individual delivery is recorded to the mail log with full error tracking.
        </p>

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isSending || recipientCount === 0}
          >
            {isSending ? "Dispatching Batch..." : `Send to ${recipientCount} members`}
          </Button>
        </div>
      </div>
    </div>
  );
}
