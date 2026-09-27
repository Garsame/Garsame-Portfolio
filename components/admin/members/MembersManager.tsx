"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import {
  deleteAdminMemberAction,
  listAdminMembersAction,
  toggleAdminMemberStatusAction,
} from "@/app/admin/(panel)/members/actions";
import type { AdminMemberView, MemberCounts } from "@/lib/admin/members";
import { SearchIcon, TrashIcon } from "../icons";

type Props = {
  initialMembers: AdminMemberView[];
  initialCounts: MemberCounts;
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
};

export function MembersManager({
  initialMembers,
  initialCounts,
  initialTotal,
  initialPage,
  initialTotalPages,
}: Props) {
  const [filter, setFilter] = useState<"all" | "active" | "unsubscribed">("all");
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<AdminMemberView[]>(initialMembers);
  const [counts, setCounts] = useState<MemberCounts>(initialCounts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const loadData = (newFilter = filter, newSearch = search, newPage = page) => {
    startTransition(async () => {
      const res = await listAdminMembersAction({
        filter: newFilter,
        search: newSearch,
        page: newPage,
        pageSize: 25,
      });
      setMembers(res.members);
      setCounts(res.counts);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    });
  };

  const handleFilterChange = (f: "all" | "active" | "unsubscribed") => {
    setFilter(f);
    setPage(1);
    loadData(f, search, 1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    loadData(filter, val, 1);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to completely remove ${name}? This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      await deleteAdminMemberAction(id);
      loadData();
    });
  };

  const handleToggleStatus = (id: string, currentStatus: "active" | "unsubscribed") => {
    const nextStatus = currentStatus === "active" ? "unsubscribed" : "active";
    startTransition(async () => {
      await toggleAdminMemberStatusAction(id, nextStatus);
      loadData();
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Top bar with count & Export CSV */}
      <div className="flex h-[68px] items-center justify-between border-b border-border bg-white px-7">
        <div className="flex flex-col gap-0.5">
          <span className="text-[18px] font-bold text-ink">Members</span>
          <span className="font-mono text-[11px] text-muted">
            {counts.active} active · {counts.unsubscribed} unsubscribed
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href={`/api/admin/members/export?filter=${filter}`}
            download
            className="flex items-center gap-2 rounded-input border border-border bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-3 shadow-card transition-colors hover:border-border-strong hover:text-ink"
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
              <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
            </svg>
            Export CSV
          </a>
          <Button href="/admin/updates" size="sm">
            Send an update
          </Button>
        </div>
      </div>

      {/* Main content container */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-tint p-6 sm:p-7">
        {/* Controls: Filter Pills & Search */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
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
              onClick={() => handleFilterChange("active")}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-button ${
                filter === "active"
                  ? "bg-blue text-white"
                  : "border border-border bg-white text-ink-3 hover:border-border-strong hover:bg-tint-soft"
              }`}
            >
              Active · {counts.active}
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("unsubscribed")}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-button ${
                filter === "unsubscribed"
                  ? "bg-blue text-white"
                  : "border border-border bg-white text-ink-3 hover:border-border-strong hover:bg-tint-soft"
              }`}
            >
              Unsubscribed · {counts.unsubscribed}
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-[300px]">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
              <SearchIcon size={15} />
            </span>
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name or email"
              className="w-full rounded-input border border-border bg-white py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Member Table Card */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-card border border-border bg-white shadow-card">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1.4fr_1.6fr_1fr_0.9fr_100px_60px] items-center gap-4 border-b border-border bg-[#F8FAFF] px-5 py-3.5 font-mono text-[10px] tracking-[0.1em] text-muted">
            <span>
              <input
                type="checkbox"
                checked={members.length > 0 && selectedIds.size === members.length}
                onChange={handleToggleSelectAll}
                className="size-4 rounded border-border text-blue focus:ring-blue"
              />
            </span>
            <span>NAME</span>
            <span>EMAIL</span>
            <span>JOINED</span>
            <span>SOURCE</span>
            <span>STATUS</span>
            <span className="text-right">ACTIONS</span>
          </div>

          {/* Table Rows */}
          <div className="flex-1 divide-y divide-border-soft overflow-y-auto">
            {members.length === 0 ? (
              <div className="p-12 text-center text-small text-muted">
                {search ? "No members match your search." : "No members found in this view."}
              </div>
            ) : (
              members.map((m) => {
                const isSelected = selectedIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    className={`grid grid-cols-[40px_1.4fr_1.6fr_1fr_0.9fr_100px_60px] items-center gap-4 px-5 py-3.5 text-small transition-colors ${
                      isSelected ? "bg-accent-soft/30" : "hover:bg-tint-soft"
                    }`}
                  >
                    <span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(m.id)}
                        className="size-4 rounded border-border text-blue focus:ring-blue"
                      />
                    </span>
                    <span className="font-semibold text-ink">{m.fullName}</span>
                    <span className="text-ink-body font-mono text-[13px]">{m.email}</span>
                    <span className="font-mono text-[12px] text-ink-body">
                      {m.joinedFormatted}
                    </span>
                    <span className="font-mono text-[12px] text-muted">
                      {m.source}
                    </span>
                    <div>
                      {m.status === "active" ? (
                        <span className="inline-block rounded-[5px] bg-[#E6F5ED] px-2 py-1 font-mono text-[10px] font-semibold text-[#1A7F4B] uppercase">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block rounded-[5px] bg-[#EEF1F9] px-2 py-1 font-mono text-[10px] font-semibold text-[#7D89AE] uppercase">
                          Left
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title={m.status === "active" ? "Set as unsubscribed" : "Set as active"}
                        onClick={() => handleToggleStatus(m.id, m.status)}
                        disabled={isPending}
                        className="rounded p-1 text-ink-3 hover:text-blue"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Delete member"
                        onClick={() => handleDelete(m.id, m.fullName)}
                        disabled={isPending}
                        className="rounded p-1 text-ink-3 hover:text-danger"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-border-soft px-5 py-3.5">
            <span className="font-mono text-[11px] text-muted">
              Showing {members.length > 0 ? (page - 1) * 25 + 1 : 0}–
              {Math.min(page * 25, total)} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1 || isPending}
                onClick={() => {
                  const p = page - 1;
                  setPage(p);
                  loadData(filter, search, p);
                }}
                className="flex size-8 items-center justify-center rounded-[7px] border border-border bg-white text-small font-semibold text-ink-3 disabled:opacity-40"
              >
                ←
              </button>
              <span className="flex size-8 items-center justify-center rounded-[7px] bg-blue text-small font-semibold text-white">
                {page}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || isPending}
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  loadData(filter, search, p);
                }}
                className="flex size-8 items-center justify-center rounded-[7px] border border-border bg-white text-small font-semibold text-ink-3 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
