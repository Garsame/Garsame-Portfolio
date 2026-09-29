"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { Button, Input, Textarea } from "@/components/ui";
import {
  changePasswordAction,
  saveSettingsAction,
  testSmtpAction,
} from "@/app/admin/(panel)/settings/actions";
import type { AdminClient, AdminSettingsView } from "@/lib/admin/settings";
import { cn } from "@/lib/utils";
import { GripIcon, LockIcon, TrashIcon } from "../icons";
import { MediaPickerModal } from "../MediaPickerModal";

type Props = {
  initialData: AdminSettingsView;
};

/* A client row needs a stable identity for drag-to-reorder that survives
   editing its name — which replaces the object on every keystroke — so it
   carries its own client-side-only key, never sent to the server. */
type EditableClient = AdminClient & { key: string };
type EditableSettingsView = Omit<AdminSettingsView, "clients"> & {
  clients: EditableClient[];
};

function withKeys(clients: AdminClient[]): EditableClient[] {
  return clients.map((c) => ({ ...c, key: crypto.randomUUID() }));
}

type NavSection =
  | "about"
  | "contact"
  | "services"
  | "process"
  | "faq"
  | "clients"
  | "smtp"
  | "password";

export function SettingsEditor({ initialData }: Props) {
  const [data, setData] = useState<EditableSettingsView>(() => ({
    ...initialData,
    clients: withKeys(initialData.clients),
  }));
  const [activeSection, setActiveSection] = useState<NavSection>("about");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [avatarPickerKey, setAvatarPickerKey] = useState<string | null>(null);
  const reduced = useReducedMotion();

  // SMTP test states
  const [smtpStatus, setSmtpStatus] = useState<string | null>(null);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpPassword, setSmtpPassword] = useState("");

  // Password change states
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMessage, setPassMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [updatingPass, setUpdatingPass] = useState(false);

  const handleSave = () => {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const payload = {
        bioShort: data.bioShort,
        bioLong: data.bioLong,
        phone: data.phone,
        email: data.email,
        location: data.location,
        clients: data.clients.map((c) => ({
          name: c.name,
          avatarId: c.avatar?.id ?? null,
        })),
        faq: data.faq,
        services: data.services,
        processSteps: data.processSteps,
        smtp: {
          host: data.smtp.host,
          port: data.smtp.port,
          secure: data.smtp.secure,
          user: data.smtp.user,
          password: smtpPassword.trim() || undefined,
          fromName: data.smtp.fromName,
          fromEmail: data.smtp.fromEmail,
        },
      };

      const res = await saveSettingsAction(payload);
      if (!res.success) {
        setError(res.error || "Could not save settings.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpStatus(null);
    try {
      const res = await testSmtpAction({
        host: data.smtp.host,
        port: data.smtp.port,
        secure: data.smtp.secure,
        user: data.smtp.user,
        password: smtpPassword.trim() || undefined,
        fromEmail: data.smtp.fromEmail,
      });
      setSmtpStatus(res.message);
    } catch {
      setSmtpStatus("Could not verify SMTP configuration.");
    } finally {
      setTestingSmtp(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage(null);

    if (newPass.length < 12) {
      setPassMessage({
        text: "New password must be at least 12 characters.",
        isError: true,
      });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMessage({ text: "Passwords do not match.", isError: true });
      return;
    }

    setUpdatingPass(true);
    try {
      const res = await changePasswordAction(currentPass, newPass);
      if (!res.success) {
        setPassMessage({
          text: res.error || "Password change failed.",
          isError: true,
        });
      } else {
        setPassMessage({
          text: "Password updated successfully.",
          isError: false,
        });
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
      }
    } catch (err) {
      setPassMessage({
        text: err instanceof Error ? err.message : "Password change failed.",
        isError: true,
      });
    } finally {
      setUpdatingPass(false);
    }
  };

  // FAQ helpers
  const addFaqQuestion = () => {
    setData((p) => ({
      ...p,
      faq: [
        ...p.faq,
        {
          question: "New question?",
          answer: "",
          order: p.faq.length + 1,
        },
      ],
    }));
  };

  const updateFaq = (
    idx: number,
    field: "question" | "answer",
    val: string,
  ) => {
    setData((p) => {
      const next = [...p.faq];
      next[idx] = { ...next[idx], [field]: val };
      return { ...p, faq: next };
    });
  };

  const moveFaq = (idx: number, dir: "up" | "down") => {
    setData((p) => {
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= p.faq.length) return p;
      const next = [...p.faq];
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return { ...p, faq: next.map((item, i) => ({ ...item, order: i + 1 })) };
    });
  };

  const removeFaq = (idx: number) => {
    setData((p) => ({
      ...p,
      faq: p.faq
        .filter((_, i) => i !== idx)
        .map((item, i) => ({ ...item, order: i + 1 })),
    }));
  };

  // Client helpers
  const addClient = () => {
    setData((p) => ({
      ...p,
      clients: [
        ...p.clients,
        {
          name: "New Client Organization",
          avatar: null,
          key: crypto.randomUUID(),
        },
      ],
    }));
  };

  const updateClientName = (idx: number, val: string) => {
    setData((p) => {
      const next = [...p.clients];
      next[idx] = { ...next[idx], name: val };
      return { ...p, clients: next };
    });
  };

  const updateClientAvatar = (idx: number, avatar: AdminClient["avatar"]) => {
    setData((p) => {
      const next = [...p.clients];
      next[idx] = { ...next[idx], avatar };
      return { ...p, clients: next };
    });
  };

  const removeClient = (idx: number) => {
    setData((p) => ({
      ...p,
      clients: p.clients.filter((_, i) => i !== idx),
    }));
  };

  const reorderClients = (order: EditableClient[]) => {
    setData((p) => ({ ...p, clients: order }));
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Top Bar */}
      <div className="flex h-17 shrink-0 items-center justify-between border-b border-border bg-white px-7">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-display-sm font-bold text-ink">Settings</h1>
          <span className="font-mono text-caption text-muted">
            the words and numbers the public site reads from
          </span>
        </div>

        <Button
          variant="primary"
          size="xs"
          onClick={handleSave}
          disabled={isPending}
        >
          {isPending ? "Saving..." : saved ? "Saved!" : "Save changes"}
        </Button>
      </div>

      {error && (
        <div className="border-red-200 bg-red-50 text-red-600 m-6 rounded-card border p-4 text-small">
          {error}
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[210px_1fr]">
        {/* Left Sub-nav */}
        <div className="flex flex-col gap-1 border-r border-border bg-white p-5 text-small">
          {[
            { id: "about", label: "About you" },
            { id: "contact", label: "Contact details" },
            { id: "services", label: "Services text" },
            { id: "process", label: "Process steps" },
            { id: "faq", label: "FAQ" },
            { id: "clients", label: "Client list" },
            { id: "smtp", label: "Email & SMTP" },
            { id: "password", label: "Password" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id as NavSection)}
              className={`flex items-center rounded-lg px-3 py-2.5 text-left font-medium transition-colors ${
                activeSection === item.id
                  ? "bg-[#EDF0FE] font-semibold text-blue"
                  : "text-ink-muted hover:bg-tint hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-7">
          {/* Section: About You */}
          {activeSection === "about" && (
            <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-6 shadow-card">
              <h2 className="text-body font-bold text-ink">About you</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-ink-muted text-caption font-semibold">
                  Short bio{" "}
                  <span className="font-normal text-muted">
                    — used under blog posts and in the footer
                  </span>
                </label>
                <Textarea
                  rows={2}
                  value={data.bioShort}
                  onChange={(e) =>
                    setData((p) => ({ ...p, bioShort: e.target.value }))
                  }
                  placeholder="Short one-paragraph bio..."
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-ink-muted text-caption font-semibold">
                  Long bio{" "}
                  <span className="font-normal text-muted">
                    — used on the About page
                  </span>
                </label>
                <Textarea
                  rows={6}
                  value={data.bioLong}
                  onChange={(e) =>
                    setData((p) => ({ ...p, bioLong: e.target.value }))
                  }
                  placeholder="Full narrative long bio..."
                />
              </div>
            </div>
          )}

          {/* Section: Contact Details */}
          {activeSection === "contact" && (
            <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-6 shadow-card">
              <h2 className="text-body font-bold text-ink">Contact details</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    Phone number
                  </label>
                  <Input
                    value={data.phone}
                    onChange={(e) =>
                      setData((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+252 61..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    Public contact email
                  </label>
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(e) =>
                      setData((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="garsame@example.com"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    Location
                  </label>
                  <Input
                    value={data.location}
                    onChange={(e) =>
                      setData((p) => ({ ...p, location: e.target.value }))
                    }
                    placeholder="Mogadishu, Somalia"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Services Text */}
          {activeSection === "services" && (
            <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-6 shadow-card">
              <h2 className="text-body font-bold text-ink">Services text</h2>

              <div className="flex flex-col gap-4">
                {data.services.map((svc, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-tint/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-blue uppercase">
                        SERVICE 0{idx + 1}
                      </span>
                      <select
                        value={svc.icon}
                        onChange={(e) => {
                          const iconVal = e.target
                            .value as AdminSettingsView["services"][number]["icon"];
                          setData((p) => {
                            const next = [...p.services];
                            next[idx] = { ...next[idx], icon: iconVal };
                            return { ...p, services: next };
                          });
                        }}
                        className="rounded border border-border bg-white px-2 py-1 font-mono text-caption focus:outline-none"
                      >
                        <option value="screen">Screen / Web App</option>
                        <option value="phone">Phone / Mobile</option>
                        <option value="chart">Chart / Operations</option>
                        <option value="mail">Mail / Messages</option>
                        <option value="automation">
                          Automation / Workflow
                        </option>
                        <option value="support">Support / Maintenance</option>
                      </select>
                    </div>

                    <Input
                      value={svc.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setData((p) => {
                          const next = [...p.services];
                          next[idx] = { ...next[idx], title: val };
                          return { ...p, services: next };
                        });
                      }}
                      placeholder="Service title"
                      className="font-bold"
                    />

                    <Textarea
                      rows={2}
                      value={svc.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setData((p) => {
                          const next = [...p.services];
                          next[idx] = { ...next[idx], description: val };
                          return { ...p, services: next };
                        });
                      }}
                      placeholder="Service description"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Process Steps */}
          {activeSection === "process" && (
            <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-6 shadow-card">
              <h2 className="text-body font-bold text-ink">Process steps</h2>

              <div className="flex flex-col gap-4">
                {data.processSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2.5 rounded-lg border border-border bg-tint/20 p-4"
                  >
                    <span className="font-mono text-[11px] font-semibold text-blue uppercase">
                      STEP 0{idx + 1}
                    </span>

                    <Input
                      value={step.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setData((p) => {
                          const next = [...p.processSteps];
                          next[idx] = { ...next[idx], title: val };
                          return { ...p, processSteps: next };
                        });
                      }}
                      placeholder="Step title"
                      className="font-bold"
                    />

                    <Textarea
                      rows={2}
                      value={step.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setData((p) => {
                          const next = [...p.processSteps];
                          next[idx] = { ...next[idx], description: val };
                          return { ...p, processSteps: next };
                        });
                      }}
                      placeholder="Step description"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: FAQ */}
          {activeSection === "faq" && (
            <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-body font-bold text-ink">FAQ</h2>
                  <span className="font-mono text-caption text-muted">
                    Questions and answers shown on the home page
                  </span>
                </div>
                <Button variant="secondary" size="xs" onClick={addFaqQuestion}>
                  + Add a question
                </Button>
              </div>

              <div className="flex flex-col gap-3.5">
                {data.faq.map((item, idx) => {
                  const isAnswered = Boolean(item.answer && item.answer.trim());
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col gap-3 rounded-card border p-4.5 transition-colors ${
                        isAnswered
                          ? "border-[#C9D2F7] bg-[#F7F9FF]"
                          : "border-border bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-1 items-center gap-2">
                          <span className="font-mono text-caption font-semibold text-muted">
                            #{idx + 1}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                              isAnswered
                                ? "bg-[#E6F5ED] text-success"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isAnswered ? "ANSWERED" : "NEEDS AN ANSWER"}
                          </span>
                        </div>

                        {/* Order & Delete actions */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveFaq(idx, "up")}
                            disabled={idx === 0}
                            className="rounded p-1 text-muted hover:bg-tint disabled:opacity-30"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFaq(idx, "down")}
                            disabled={idx === data.faq.length - 1}
                            className="rounded p-1 text-muted hover:bg-tint disabled:opacity-30"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFaq(idx)}
                            className="hover:text-red-600 rounded p-1 text-muted"
                            title="Delete question"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <Input
                        value={item.question}
                        onChange={(e) =>
                          updateFaq(idx, "question", e.target.value)
                        }
                        placeholder="Question title"
                        className="text-small font-bold"
                      />

                      <Textarea
                        rows={3}
                        value={item.answer || ""}
                        onChange={(e) =>
                          updateFaq(idx, "answer", e.target.value)
                        }
                        placeholder="Answer (optional placeholder will show if empty)..."
                        className="bg-white text-small"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Client List */}
          {activeSection === "clients" && (
            <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-body font-bold text-ink">Client list</h2>
                  <span className="font-mono text-caption text-muted">
                    Organisations shown in the &quot;Working with&quot; home
                    page strip. Drag to reorder — this is also the order the
                    hero avatar stack shows them in.
                  </span>
                </div>
                <Button variant="secondary" size="xs" onClick={addClient}>
                  + Add client
                </Button>
              </div>

              <Reorder.Group
                as="ul"
                axis="y"
                values={data.clients}
                onReorder={reorderClients}
                className="flex flex-col gap-2.5"
              >
                {data.clients.map((client, idx) => (
                  <ClientRow
                    key={client.key}
                    client={client}
                    reduced={Boolean(reduced)}
                    onNameChange={(val) => updateClientName(idx, val)}
                    onPickAvatar={() => setAvatarPickerKey(client.key)}
                    onRemoveAvatar={() => updateClientAvatar(idx, null)}
                    onRemove={() => removeClient(idx)}
                  />
                ))}
              </Reorder.Group>
            </div>
          )}

          <MediaPickerModal
            open={avatarPickerKey !== null}
            onClose={() => setAvatarPickerKey(null)}
            accept="images"
            title="Select a client avatar"
            onSelect={(file) => {
              const idx = data.clients.findIndex(
                (c) => c.key === avatarPickerKey,
              );
              if (idx !== -1) {
                updateClientAvatar(idx, {
                  id: file.id,
                  url: file.url,
                  originalName: file.originalName,
                });
              }
              setAvatarPickerKey(null);
            }}
          />

          {/* Section: Email & SMTP */}
          {activeSection === "smtp" && (
            <div className="flex flex-col gap-5 rounded-card border border-border bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-body font-bold text-ink">
                  Email &amp; SMTP
                </h2>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-success">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    CONFIGURED
                  </span>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp}
                  >
                    {testingSmtp ? "Testing..." : "Send a test email"}
                  </Button>
                </div>
              </div>

              {smtpStatus && (
                <div className="rounded-card border border-blue/30 bg-blue-wash/30 p-3 font-mono text-caption text-blue">
                  {smtpStatus}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5 sm:col-span-1">
                  <label className="text-ink-muted text-caption font-semibold">
                    Host
                  </label>
                  <Input
                    value={data.smtp.host}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        smtp: { ...p.smtp, host: e.target.value },
                      }))
                    }
                    placeholder="smtp.provider.com"
                    className="font-mono text-caption"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    Port
                  </label>
                  <Input
                    type="number"
                    value={data.smtp.port}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        smtp: {
                          ...p.smtp,
                          port: Number(e.target.value) || 587,
                        },
                      }))
                    }
                    placeholder="587"
                    className="font-mono text-caption"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    Security
                  </label>
                  <select
                    value={data.smtp.secure ? "ssl" : "starttls"}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        smtp: { ...p.smtp, secure: e.target.value === "ssl" },
                      }))
                    }
                    className="rounded-input border border-border bg-white px-3 py-2 text-caption focus:outline-none"
                  >
                    <option value="starttls">STARTTLS (Port 587 / 25)</option>
                    <option value="ssl">SSL / TLS (Port 465)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    Username
                  </label>
                  <Input
                    value={data.smtp.user}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        smtp: { ...p.smtp, user: e.target.value },
                      }))
                    }
                    placeholder="apikey / user"
                    className="font-mono text-caption"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    From Name
                  </label>
                  <Input
                    value={data.smtp.fromName}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        smtp: { ...p.smtp, fromName: e.target.value },
                      }))
                    }
                    placeholder="Garsame Mohamud"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    From Email
                  </label>
                  <Input
                    type="email"
                    value={data.smtp.fromEmail}
                    onChange={(e) =>
                      setData((p) => ({
                        ...p,
                        smtp: { ...p.smtp, fromEmail: e.target.value },
                      }))
                    }
                    placeholder="noreply@domain.com"
                    className="font-mono text-caption"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-ink-muted text-caption font-semibold">
                  SMTP Password{" "}
                  <span className="font-normal text-muted">
                    {data.smtp.hasPassword
                      ? "(Password set · enter new value only to change)"
                      : "(Not set)"}
                  </span>
                </label>
                <Input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="font-mono text-caption"
                />
              </div>

              <div className="text-ink-muted flex items-center gap-3 rounded-lg border border-border bg-[#F5F7FE] p-3 text-caption">
                <LockIcon className="h-4 w-4 shrink-0 text-muted" />
                <span>
                  The password is encrypted at rest and never shown again after
                  it is saved. Every send made with it is written to the mail
                  log.
                </span>
              </div>
            </div>
          )}

          {/* Section: Password */}
          {activeSection === "password" && (
            <div className="flex max-w-md flex-col gap-5 rounded-card border border-border bg-white p-6 shadow-card">
              <h2 className="text-body font-bold text-ink">
                Change Admin Password
              </h2>

              <form
                onSubmit={handlePasswordChange}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    New Password (min 12 characters)
                  </label>
                  <Input
                    type="password"
                    required
                    minLength={12}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-ink-muted text-caption font-semibold">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    required
                    minLength={12}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="••••••••••••"
                  />
                </div>

                {passMessage && (
                  <p
                    className={`rounded p-3 text-caption font-medium ${
                      passMessage.isError
                        ? "border-red-200 bg-red-50 text-red-600 border"
                        : "border-green-200 bg-green-50 border text-success"
                    }`}
                  >
                    {passMessage.text}
                  </p>
                )}

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={updatingPass}
                  className="mt-2"
                >
                  {updatingPass ? "Updating..." : "Update password"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- client row */

function ClientRow({
  client,
  reduced,
  onNameChange,
  onPickAvatar,
  onRemoveAvatar,
  onRemove,
}: {
  client: AdminClient & { key: string };
  reduced: boolean;
  onNameChange: (val: string) => void;
  onPickAvatar: () => void;
  onRemoveAvatar: () => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);

  return (
    <Reorder.Item
      as="li"
      value={client}
      dragListener={false}
      dragControls={controls}
      layout="position"
      /* Reduced motion: rows jump to their new place instead of sliding. */
      transition={reduced ? { duration: 0 } : undefined}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      className={cn(
        "flex items-center gap-2.5 rounded-input border bg-white p-2",
        dragging ? "z-10 border-blue-wash" : "border-border",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${client.name || "client"}. Use the up and down arrow keys.`}
        onPointerDown={(e) => controls.start(e)}
        className="flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-input text-faint transition-button hover:text-muted-strong active:cursor-grabbing"
      >
        <GripIcon />
      </button>

      <button
        type="button"
        onClick={onPickAvatar}
        title="Change avatar"
        aria-label={`Change avatar for ${client.name || "client"}`}
        className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-tint text-caption font-semibold text-muted transition-button hover:border-blue hover:text-blue"
      >
        {client.avatar ? (
          <Image
            src={client.avatar.url}
            alt=""
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : (
          "+"
        )}
      </button>

      <Input
        value={client.name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Organization name"
        className="flex-1 font-semibold"
      />

      {client.avatar ? (
        <button
          type="button"
          onClick={onRemoveAvatar}
          className="hover:text-red-600 font-mono text-[10px] text-muted"
          title="Remove avatar, keep the client"
        >
          Remove photo
        </button>
      ) : null}

      <button
        type="button"
        onClick={onRemove}
        className="hover:text-red-600 p-1 text-muted"
        title="Remove client"
        aria-label={`Remove ${client.name || "client"}`}
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </Reorder.Item>
  );
}
