"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

export type ScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledForIso: string) => Promise<{ ok: boolean; message?: string }>;
  initialDate?: string | null;
  isPending: boolean;
};

export function ScheduleModal({
  isOpen,
  onClose,
  onSchedule,
  initialDate,
  isPending,
}: ScheduleModalProps) {
  const [dateTime, setDateTime] = useState(() => {
    if (initialDate) return new Date(initialDate).toISOString().slice(0, 16);
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selected = new Date(dateTime);
    if (isNaN(selected.getTime())) {
      setError("Please choose a valid date and time.");
      return;
    }
    if (selected.getTime() <= Date.now()) {
      setError("Please choose a date and time in the future.");
      return;
    }

    setError(null);
    const res = await onSchedule(selected.toISOString());
    if (res.ok) {
      onClose();
    } else {
      setError(res.message || "Failed to schedule broadcast.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex w-full max-w-md flex-col rounded-card border border-border bg-white p-6 shadow-2xl">
        <h3 className="text-h3 text-ink mb-1">Schedule Broadcast</h3>
        <p className="text-small text-ink-body mb-4">
          Choose when this update should automatically be dispatched to members.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-btn bg-[#FDF0EE] p-3 text-small text-[#C0342B] border border-[#F0C9C6]">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-small font-semibold text-ink">
              Send Date &amp; Time (Mogadishu EAT)
            </label>
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Scheduling..." : "Confirm Schedule"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
