"use client";

import { useState, useTransition } from "react";
import { Button, Textarea } from "@/components/ui";
import {
  deleteAdminMessageAction,
  replyAdminMessageAction,
  setMessageArchivedAction,
  setMessageReadAction,
} from "@/app/admin/(panel)/messages/actions";
import type { AdminMessageView, MessageCounts } from "@/lib/admin/messages";

type Props = {
  initialMessages: AdminMessageView[];
  initialCounts: MessageCounts;
};

export function MessagesManager({ initialMessages, initialCounts }: Props) {
  const [filter, setFilter] = useState<"unread" | "all" | "archived">("unread");
  const [messages, setMessages] = useState<AdminMessageView[]>(initialMessages);
  const [counts, setCounts] = useState<MessageCounts>(initialCounts);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialMessages.length > 0 ? initialMessages[0].id : null,
  );
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySuccess, setReplySuccess] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredMessages = messages.filter((m) => {
    if (filter === "unread") return !m.read && !m.archived;
    if (filter === "archived") return m.archived;
    return true; // "all"
  });

  const selectedMessage =
    messages.find((m) => m.id === selectedId) || filteredMessages[0] || null;

  const handleSelect = (msg: AdminMessageView) => {
    setSelectedId(msg.id);
    if (!msg.read) {
      // Auto mark read on view
      handleToggleRead(msg.id, true);
    }
  };

  const handleToggleRead = (id: string, read: boolean) => {
    startTransition(async () => {
      await setMessageReadAction(id, read);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, read } : m)),
      );
      setCounts((prev) => ({
        ...prev,
        unread: read ? Math.max(0, prev.unread - 1) : prev.unread + 1,
      }));
    });
  };

  const handleToggleArchive = (id: string, archived: boolean) => {
    startTransition(async () => {
      await setMessageArchivedAction(id, archived);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, archived } : m)),
      );
      setCounts((prev) => ({
        ...prev,
        archived: archived ? prev.archived + 1 : Math.max(0, prev.archived - 1),
        unread:
          archived && !selectedMessage?.read
            ? Math.max(0, prev.unread - 1)
            : prev.unread,
      }));
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    startTransition(async () => {
      await deleteAdminMessageAction(id);
      const remaining = messages.filter((m) => m.id !== id);
      setMessages(remaining);
      if (selectedId === id) {
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
      setCounts((prev) => ({
        ...prev,
        all: Math.max(0, prev.all - 1),
        unread: selectedMessage && !selectedMessage.read ? Math.max(0, prev.unread - 1) : prev.unread,
        archived: selectedMessage && selectedMessage.archived ? Math.max(0, prev.archived - 1) : prev.archived,
      }));
    });
  };

  const handleSendReply = () => {
    if (!selectedMessage || !replyText.trim()) return;
    setReplyError(null);

    startTransition(async () => {
      const res = await replyAdminMessageAction(selectedMessage.id, replyText);
      if (res.success) {
        setReplySuccess(true);
        setTimeout(() => {
          setReplyModalOpen(false);
          setReplyText("");
          setReplySuccess(false);
        }, 1500);
      } else {
        setReplyError(res.error || "Failed to send email reply.");
      }
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top bar with filter pills */}
      <div className="flex h-[68px] items-center justify-between border-b border-border bg-white px-7">
        <div className="flex flex-col gap-0.5">
          <span className="text-[18px] font-bold text-ink">Messages</span>
          <span className="font-mono text-[11px] text-muted">
            {counts.unread} unread · {counts.all} total
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-button ${
              filter === "unread"
                ? "bg-blue text-white"
                : "border border-border bg-white text-ink-3 hover:border-border-strong hover:bg-tint-soft"
            }`}
          >
            Unread · {counts.unread}
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-button ${
              filter === "all"
                ? "bg-blue text-white"
                : "border border-border bg-white text-ink-3 hover:border-border-strong hover:bg-tint-soft"
            }`}
          >
            All · {counts.all}
          </button>
          <button
            type="button"
            onClick={() => setFilter("archived")}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-button ${
              filter === "archived"
                ? "bg-blue text-white"
                : "border border-border bg-white text-ink-3 hover:border-border-strong hover:bg-tint-soft"
            }`}
          >
            Archived · {counts.archived}
          </button>
        </div>
      </div>

      {/* 2-Pane Content */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[380px_1fr]">
        {/* Left message list */}
        <div className="flex flex-col overflow-y-auto border-r border-border bg-white">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-ink-3">
              <p className="text-small">No messages in this view.</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;
              return (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => handleSelect(msg)}
                  className={`flex flex-col gap-1.5 border-b border-border-soft p-4 text-left transition-colors ${
                    isSelected
                      ? "border-l-[3px] border-l-blue bg-[#F7F9FF]"
                      : "hover:bg-tint-soft"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex items-center gap-2 text-[14px] ${
                        !msg.read
                          ? "font-bold text-ink"
                          : "font-semibold text-ink-3"
                      }`}
                    >
                      {!msg.read && (
                        <span className="size-2 rounded-full bg-blue" />
                      )}
                      {msg.name}
                    </span>
                    <span className="font-mono text-[11px] text-muted">
                      {msg.timeAgo}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-blue">
                    {[msg.business, msg.need].filter(Boolean).join(" · ") ||
                      "Enquiry"}
                  </span>
                  <p className="line-clamp-2 text-[13px] leading-[1.5] text-ink-body">
                    {msg.message}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Right detail view */}
        {selectedMessage ? (
          <div className="flex flex-col gap-5 overflow-y-auto bg-tint p-7 sm:p-8">
            {/* Header info + actions */}
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-h2 font-extrabold tracking-tight text-ink">
                  {selectedMessage.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-small text-ink-body">
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="font-mono text-[13px] text-blue hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                  {selectedMessage.business && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-ink">
                        {selectedMessage.business}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {selectedMessage.need && (
                    <span className="rounded-[5px] bg-accent-soft px-2 py-1 font-mono text-[10px] font-semibold text-blue uppercase">
                      {selectedMessage.need}
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-muted">
                    received{" "}
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Mogadishu",
                    }).format(new Date(selectedMessage.createdAt))}{" "}
                    EAT
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {/* Mark Read/Unread */}
                <button
                  type="button"
                  title={selectedMessage.read ? "Mark as unread" : "Mark as read"}
                  onClick={() =>
                    handleToggleRead(selectedMessage.id, !selectedMessage.read)
                  }
                  disabled={isPending}
                  className="flex size-9 items-center justify-center rounded-input border border-border bg-white text-ink-3 transition-colors hover:border-border-strong hover:text-blue"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M4 4h16v10H7l-3 3z" />
                  </svg>
                </button>

                {/* Archive / Unarchive */}
                <button
                  type="button"
                  title={selectedMessage.archived ? "Unarchive" : "Archive"}
                  onClick={() =>
                    handleToggleArchive(
                      selectedMessage.id,
                      !selectedMessage.archived,
                    )
                  }
                  disabled={isPending}
                  className={`flex size-9 items-center justify-center rounded-input border border-border bg-white transition-colors hover:border-border-strong hover:text-blue ${
                    selectedMessage.archived ? "text-blue" : "text-ink-3"
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect x="3" y="4" width="18" height="5" />
                    <path d="M5 9v11h14V9" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  title="Delete message"
                  onClick={() => handleDelete(selectedMessage.id)}
                  disabled={isPending}
                  className="flex size-9 items-center justify-center rounded-input border border-border bg-white text-ink-3 transition-colors hover:border-danger hover:text-danger"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>

                {/* Reply button */}
                <Button
                  size="sm"
                  onClick={() => setReplyModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  Reply
                </Button>
              </div>
            </div>

            {/* Message Body Box */}
            <div className="rounded-card border border-border bg-white p-7 text-body-large leading-[1.8] text-[#2B3453] shadow-card whitespace-pre-wrap">
              {selectedMessage.message}
            </div>

            {/* Context cards */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 rounded-card border border-border bg-white p-4.5 shadow-card">
                <span className="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
                  SUGGESTED SERVICE
                </span>
                <span className="text-small font-semibold text-ink">
                  {selectedMessage.need || "Custom web system"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-card border border-border bg-white p-4.5 shadow-card">
                <span className="font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
                  SENDER EMAIL
                </span>
                <span className="text-small font-semibold text-ink">
                  {selectedMessage.email}
                </span>
              </div>
            </div>

            {/* SLA Prompt Banner */}
            <div className="mt-auto flex items-center gap-3 rounded-card bg-accent-soft p-4 text-[#24356F]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3D5AF1"
                strokeWidth="2"
                strokeLinecap="round"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              <span className="text-small">
                Your contact page promises a reply within 24 hours. This one
                arrived {selectedMessage.timeAgo}.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-12 text-ink-3">
            <p>Select a message to view details.</p>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyModalOpen && selectedMessage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex w-full max-w-[600px] flex-col gap-5 rounded-card border border-border bg-white p-7 shadow-xl">
            <div className="flex items-center justify-between border-b border-border-soft pb-4">
              <div className="flex flex-col">
                <h3 className="text-h3 text-ink">
                  Reply to {selectedMessage.name}
                </h3>
                <span className="font-mono text-[12px] text-muted">
                  To: {selectedMessage.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReplyModalOpen(false)}
                className="rounded-input p-1 text-ink-3 hover:text-ink"
              >
                ✕
              </button>
            </div>

            {replySuccess ? (
              <div className="rounded-input bg-success-soft p-4 text-small text-success-ink">
                ✓ Reply sent successfully and recorded in mail log!
              </div>
            ) : (
              <>
                {replyError && (
                  <div className="rounded-input bg-danger-soft p-3 text-small text-danger-ink">
                    {replyError}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label htmlFor="reply-body" className="text-small font-semibold text-ink-3">
                    Message
                  </label>
                  <Textarea
                    id="reply-body"
                    rows={8}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="h-44 text-small"
                  />
                </div>

                <div className="flex justify-between gap-3 pt-2">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                      `Re: Your enquiry to Garsame`,
                    )}&body=${encodeURIComponent(replyText)}`}
                    className="text-caption text-blue hover:underline self-center"
                  >
                    Open in Mail Client instead
                  </a>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setReplyModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendReply}
                      disabled={isPending || !replyText.trim()}
                    >
                      {isPending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
