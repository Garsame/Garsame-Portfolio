"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Wordmark } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, isCurrentAdmin, type SidebarCounts } from "@/lib/admin/nav";
import { CloseIcon, MenuIcon, ModuleIcon } from "./icons";

/**
 * The admin frame — design/21-admin-dashboard.html: a 276px sidebar with the
 * eleven modules, and the page beside it on --color-tint.
 *
 * The design is drawn at 1440px only. Below 1024px the sidebar becomes a
 * drawer opened from the top bar, so the admin works on a phone. D-063.
 */

type Admin = { name: string | null; email: string };

const NavContext = createContext<{ open: () => void }>({ open: () => {} });

export function AdminShell({
  admin,
  counts,
  signOut,
  children,
}: {
  admin: Admin;
  counts: SidebarCounts;
  /** A server action — the sign-out form posts to it. */
  signOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  /* Stored as the path it was opened on, so navigating closes it — the same
     pattern as the public header. */
  const [openPath, setOpenPath] = useState<string | null>(null);
  const drawerOpen = openPath === pathname;

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenPath(null);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  const sidebar = (
    <Sidebar
      admin={admin}
      counts={counts}
      pathname={pathname}
      signOut={signOut}
    />
  );

  return (
    <NavContext.Provider value={{ open: () => setOpenPath(pathname) }}>
      <div className="flex min-h-screen flex-1 bg-tint">
        <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
          {sidebar}
        </div>

        {drawerOpen ? (
          <div
            id="admin-nav"
            className="fixed inset-0 z-50 flex lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
          >
            <div className="relative h-full">
              {sidebar}
              <button
                type="button"
                onClick={() => setOpenPath(null)}
                aria-label="Close menu"
                className="absolute top-3 right-2 flex size-11 items-center justify-center rounded-input text-ink-3 hover:text-blue"
              >
                <CloseIcon />
              </button>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => setOpenPath(null)}
              className="flex-1 bg-ink/40"
            />
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </NavContext.Provider>
  );
}

/** The menu button in the top bar, below 1024px. */
export function NavButton() {
  const { open } = useContext(NavContext);
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open menu"
      aria-controls="admin-nav"
      className="-ml-2 flex size-11 items-center justify-center rounded-input text-ink-2 transition-button hover:text-blue lg:hidden"
    >
      <MenuIcon />
    </button>
  );
}

function Sidebar({
  admin,
  counts,
  pathname,
  signOut,
}: {
  admin: Admin;
  counts: SidebarCounts;
  pathname: string;
  signOut: () => Promise<void>;
}) {
  const initial = (admin.name ?? admin.email).trim().charAt(0).toUpperCase();

  return (
    <aside className="flex h-full w-sidebar flex-col gap-5.5 overflow-y-auto border-r border-border bg-white px-3.5 py-5">
      <div className="flex min-h-11 items-center px-2.5">
        <Wordmark size="admin" href="/admin" />
      </div>

      <nav aria-label="Admin">
        <ul className="flex flex-col gap-0.5">
          {ADMIN_NAV.map((item) => {
            const current = isCurrentAdmin(pathname, item.href);
            const count = item.count ? counts[item.count.key] : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-2 rounded-input px-3 py-2.5 text-small transition-button",
                    current
                      ? "bg-accent-soft font-semibold text-blue"
                      : "font-medium text-ink-3 hover:bg-tint hover:text-ink",
                  )}
                >
                  <span className="flex items-center gap-2.75">
                    <ModuleIcon
                      icon={item.icon}
                      className={current ? "text-blue" : "text-muted-strong"}
                    />
                    {item.label}
                  </span>
                  {item.count && count > 0 ? (
                    item.count.style === "plain" ? (
                      <span className="font-mono text-mono-meta font-regular tracking-none text-muted">
                        {count}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "rounded-pill px-1.75 py-0.75 font-mono text-mono-chip tracking-none text-white",
                          item.count.style === "warning"
                            ? "bg-warning"
                            : "bg-blue",
                        )}
                      >
                        {count}
                        <span className="sr-only">
                          {item.count.key === "unreadMessages"
                            ? " unread"
                            : " pending"}
                        </span>
                      </span>
                    )
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-border-header p-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-border-strong text-caption font-bold text-ink-3"
        >
          {initial}
        </span>
        <div className="flex min-w-0 flex-col gap-px">
          <span className="truncate text-caption font-semibold text-ink">
            {admin.name ?? admin.email}
          </span>
          <form action={signOut}>
            {/* The label is 11px, as drawn. The invisible ::after extends the
                hit area to a 44px-tall target without changing the look. */}
            <button
              type="submit"
              className="relative text-micro font-regular text-muted transition-button after:absolute after:-inset-x-3 after:-inset-y-4.5 after:content-[''] hover:text-blue"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
