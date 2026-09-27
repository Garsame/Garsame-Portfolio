"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { BlockEditor } from "@/components/admin/editor/BlockEditor";
import type { EditorNode } from "@/lib/editor-content";
import { isEmptyDoc, readingTime, wordCount } from "@/lib/editor-content";
import type {
  AdminBroadcastDetail,
  PastUpdateSummary,
} from "@/lib/admin/updates";
import {
  cancelScheduleAction,
  saveDraftAction,
  scheduleAction,
  sendBroadcastAction,
  sendTestAction,
} from "@/app/admin/(editor)/updates/actions";
import { BroadcastConfirmModal } from "./BroadcastConfirmModal";
import { ScheduleModal } from "./ScheduleModal";

export type UpdateEditorProps = {
  initialBroadcast?: AdminBroadcastDetail | null;
  activeMembersCount: number;
  pastUpdates: PastUpdateSummary[];
  fromEmail: string;
};

export function UpdateEditor({
  initialBroadcast,
  activeMembersCount,
  pastUpdates,
  fromEmail,
}: UpdateEditorProps) {
  const router = useRouter();

  const [id, setId] = useState<string | undefined>(initialBroadcast?.id);
  const [subject, setSubject] = useState(initialBroadcast?.subject || "");
  const [previewText, setPreviewText] = useState(
    initialBroadcast?.previewText || "",
  );
  const [body, setBody] = useState<EditorNode | null>(
    (initialBroadcast?.body as EditorNode) || null,
  );
  const [state, setState] = useState<string>(
    initialBroadcast?.state || "draft",
  );
  const [scheduledFor, setScheduledFor] = useState<string | null>(
    initialBroadcast?.scheduledFor || null,
  );

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved",
  );
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [isPending, startTransition] = useTransition();

  const estMinutes = Math.max(1, Math.ceil(activeMembersCount / 20));

  // Autosave logic
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSave = useCallback(
    async (currentSubject: string, currentPreview: string, currentBody: EditorNode | null) => {
      if (!currentSubject.trim()) return; // Don't autosave if no subject yet
      setSaveStatus("saving");
      setErrorMessage(null);

      const res = await saveDraftAction({
        id,
        subject: currentSubject.trim(),
        previewText: currentPreview.trim() || undefined,
        body: currentBody,
      });

      if (res.ok && res.id) {
        if (!id) {
          setId(res.id);
          window.history.replaceState(null, "", `/admin/updates/${res.id}`);
        }
        setSaveStatus("saved");
        setLastSavedTime(new Date());
      } else {
        setSaveStatus("unsaved");
        if (res.message) setErrorMessage(res.message);
      }
    },
    [id],
  );

  const triggerAutosave = useCallback(
    (nextSubject: string, nextPreview: string, nextBody: EditorNode | null) => {
      setSaveStatus("unsaved");
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        performSave(nextSubject, nextPreview, nextBody);
      }, 2000);
    },
    [performSave],
  );

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    triggerAutosave(val, previewText, body);
  };

  const handlePreviewChange = (val: string) => {
    setPreviewText(val);
    triggerAutosave(subject, val, body);
  };

  const handleBodyChange = (doc: EditorNode | null) => {
    setBody(doc);
    triggerAutosave(subject, previewText, doc);
  };

  // Test Email handler
  const handleSendTest = () => {
    if (!subject.trim()) {
      setErrorMessage("Please give the update a subject line before sending a test.");
      return;
    }
    setErrorMessage(null);
    setToastMessage("Sending test email...");

    startTransition(async () => {
      const res = await sendTestAction({
        subject,
        previewText,
        body,
      });

      if (res.ok) {
        setToastMessage(`✓ Test email sent to ${res.to}`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setErrorMessage(res.message || "Failed to send test email.");
        setToastMessage(null);
      }
    });
  };

  // Schedule handler
  const handleScheduleConfirm = async (scheduledForIso: string) => {
    if (!id) {
      // First save draft
      const saveRes = await saveDraftAction({
        subject: subject.trim(),
        previewText: previewText.trim() || undefined,
        body,
      });
      if (!saveRes.ok || !saveRes.id) {
        return { ok: false, message: saveRes.message || "Failed to save draft." };
      }
      setId(saveRes.id);
      const schedRes = await scheduleAction(saveRes.id, scheduledForIso);
      if (schedRes.ok) {
        setState("scheduled");
        setScheduledFor(scheduledForIso);
        router.refresh();
      }
      return schedRes;
    } else {
      const schedRes = await scheduleAction(id, scheduledForIso);
      if (schedRes.ok) {
        setState("scheduled");
        setScheduledFor(scheduledForIso);
        router.refresh();
      }
      return schedRes;
    }
  };

  const handleCancelSchedule = () => {
    if (!id) return;
    startTransition(async () => {
      const res = await cancelScheduleAction(id);
      if (res.ok) {
        setState("draft");
        setScheduledFor(null);
        setToastMessage("Scheduled broadcast reverted to draft.");
        setTimeout(() => setToastMessage(null), 3000);
        router.refresh();
      }
    });
  };

  // Dispatch broadcast handler
  const handleDispatch = async () => {
    if (!subject.trim()) {
      setErrorMessage("Please enter a subject line.");
      return;
    }
    if (isEmptyDoc(body)) {
      setErrorMessage("Please write body content before sending.");
      return;
    }

    setIsSendingBatch(true);
    setErrorMessage(null);

    let broadcastId = id;
    if (!broadcastId) {
      const saveRes = await saveDraftAction({
        subject: subject.trim(),
        previewText: previewText.trim() || undefined,
        body,
      });
      if (!saveRes.ok || !saveRes.id) {
        setIsSendingBatch(false);
        setErrorMessage(saveRes.message || "Failed to save broadcast before sending.");
        return;
      }
      broadcastId = saveRes.id;
      setId(saveRes.id);
    }

    const res = await sendBroadcastAction(broadcastId);
    setIsSendingBatch(false);
    setIsConfirmModalOpen(false);

    if (res.ok) {
      router.push(`/admin/updates/${broadcastId}/logs`);
    } else {
      setErrorMessage(res.message || "Failed to dispatch broadcast.");
    }
  };

  const words = body ? wordCount(body) : 0;
  const mins = body ? readingTime(body) : 1;

  const subtitleText =
    state === "scheduled" && scheduledFor
      ? `Scheduled for ${new Date(scheduledFor).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
      : state === "sent"
        ? "Sent broadcast"
        : saveStatus === "saving"
          ? "Saving..."
          : lastSavedTime
            ? `Draft · saved ${lastSavedTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
            : "Draft";

  return (
    <div className="flex flex-col min-h-screen bg-tint">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-border bg-white px-7">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/updates"
            className="flex size-8 items-center justify-center rounded-btn text-muted hover:bg-tint hover:text-ink transition-button"
            title="Back to updates"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-body-lg font-bold text-ink">
              {id ? "Edit update" : "New update"}
            </h1>
            <span className="font-mono text-mono-meta text-muted">
              {subtitleText}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {state === "scheduled" ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCancelSchedule}
              disabled={isPending}
            >
              Cancel schedule
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSendTest}
                disabled={isPending || isSendingBatch}
              >
                Send test to myself
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsScheduleModalOpen(true)}
                disabled={isPending || isSendingBatch || state === "sent"}
              >
                Schedule
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={isPending || isSendingBatch || state === "sent" || activeMembersCount === 0}
              >
                Send to {activeMembersCount} members
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-6 p-7 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Editor Surface */}
        <div className="flex flex-col rounded-card border border-border bg-white shadow-card overflow-hidden">
          {/* Toast / Notice Bar */}
          {toastMessage && (
            <div className="bg-[#E6F5ED] border-b border-[#C3E8D4] px-6 py-2.5 text-small font-semibold text-[#1A7F4B] flex items-center justify-between animate-in fade-in">
              <span>{toastMessage}</span>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-[#1A7F4B] hover:opacity-75"
              >
                ✕
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="bg-[#FDF0EE] border-b border-[#F0C9C6] px-6 py-2.5 text-small font-semibold text-[#C0342B] flex items-center justify-between animate-in fade-in">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-[#C0342B] hover:opacity-75"
              >
                ✕
              </button>
            </div>
          )}

          {/* Subject & Preview Inputs */}
          <div className="flex flex-col gap-3.5 border-b border-border/70 p-6">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-mono-chip tracking-wider text-muted uppercase">
                SUBJECT
              </span>
              <Input
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                placeholder="Heelan is live, and what it taught me about cutting features"
                className="text-[19px] font-bold tracking-tight text-ink border-0 px-0 focus:ring-0 shadow-none placeholder:text-muted/60"
                maxLength={150}
              />
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3">
              <span className="font-mono text-mono-chip tracking-wider text-muted uppercase">
                PREVIEW TEXT
              </span>
              <Input
                value={previewText}
                onChange={(e) => handlePreviewChange(e.target.value)}
                placeholder="The one we removed was the one everybody wanted."
                className="text-[14px] text-ink-body border-0 px-0 focus:ring-0 shadow-none placeholder:text-muted/60"
                maxLength={200}
              />
            </div>
          </div>

          {/* Block Editor Content */}
          <div className="flex-1 p-6">
            <BlockEditor
              label="Update body content"
              value={body}
              onChange={handleBodyChange}
              placeholder="Type / to insert a block or start writing..."
            />
          </div>

          {/* Word Count / Footer Info */}
          <div className="flex items-center justify-between border-t border-border/70 px-6 py-3 font-mono text-mono-meta text-muted">
            <span>
              {words} words · {mins} min read
            </span>
            <span>
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                  ? "Autosaved"
                  : "Unsaved changes"}
            </span>
          </div>
        </div>

        {/* Right Rail: Meta & Past Updates */}
        <div className="flex flex-col gap-5">
          {/* Recipients Card */}
          <div className="flex flex-col gap-3.5 rounded-card border border-border bg-white p-5 shadow-card">
            <span className="text-small font-bold text-ink">Recipients</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-extrabold tracking-tight text-ink">
                {activeMembersCount}
              </span>
              <span className="text-small text-ink-body">active members</span>
            </div>
            <div className="flex items-start gap-2.5 rounded-btn bg-[#FBF1E3] p-3 text-[12px] leading-[1.55] text-[#6B4200]">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B4690E"
                strokeWidth="2"
                strokeLinecap="round"
                className="mt-0.5 shrink-0"
              >
                <path d="M12 9v4M12 17v.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              <span>
                You will be asked to confirm the number before anything is sent.
              </span>
            </div>
          </div>

          {/* Sending Info Card */}
          <div className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card">
            <span className="text-small font-bold text-ink">Sending</span>
            <div className="flex justify-between text-small">
              <span className="text-ink-body">Rate</span>
              <span className="font-mono text-ink">20 / minute</span>
            </div>
            <div className="flex justify-between text-small">
              <span className="text-ink-body">Estimated time</span>
              <span className="font-mono text-ink">~{estMinutes} minutes</span>
            </div>
            <div className="flex justify-between text-small">
              <span className="text-ink-body">From</span>
              <span className="font-mono text-ink truncate max-w-[140px]" title={fromEmail}>
                {fromEmail}
              </span>
            </div>
          </div>

          {/* Past Updates Card */}
          <div className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-small font-bold text-ink">Past updates</span>
              <Link
                href="/admin/updates"
                className="font-mono text-mono-meta text-blue hover:underline"
              >
                See all
              </Link>
            </div>
            <div className="flex flex-col divide-y divide-border/60">
              {pastUpdates.length > 0 ? (
                pastUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="flex flex-col gap-1 py-3 first:pt-1 last:pb-0"
                  >
                    <Link
                      href={`/admin/updates/${update.id}/logs`}
                      className="text-small font-semibold text-ink hover:text-blue line-clamp-1 transition-button"
                    >
                      {update.subject}
                    </Link>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-muted">
                      <span>
                        {new Date(update.sentAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-[#1A7F4B]">
                        {update.deliveredCount} sent
                      </span>
                      {update.failedCount > 0 && (
                        <span className="text-[#C0342B]">
                          {update.failedCount} failed
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <span className="py-2 text-small text-muted">
                  No past broadcast updates yet.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <BroadcastConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDispatch}
        subject={subject}
        recipientCount={activeMembersCount}
        isSending={isSendingBatch}
      />

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleConfirm}
        initialDate={scheduledFor}
        isPending={isPending}
      />
    </div>
  );
}
