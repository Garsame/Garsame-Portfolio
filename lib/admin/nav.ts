/**
 * The eleven admin modules — docs/04-ADMIN.md. One list, used by the sidebar,
 * the mobile drawer and the module stubs, so they cannot disagree.
 */

export type AdminIcon =
  | "dashboard"
  | "members"
  | "updates"
  | "blog"
  | "projects"
  | "testimonials"
  | "messages"
  | "stats"
  | "files"
  | "branding"
  | "settings";

/** The counts the sidebar shows beside a module. */
export type SidebarCounts = {
  members: number;
  pendingTestimonials: number;
  unreadMessages: number;
};

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminIcon;
  /** Which count to show, and how — design/21-admin-dashboard.html. */
  count?: { key: keyof SidebarCounts; style: "plain" | "warning" | "accent" };
  /** The phase in docs/06-BUILD-PROMPTS.md that builds the module. */
  phase: string;
};

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", phase: "Phase 5" },
  {
    href: "/admin/members",
    label: "Members",
    icon: "members",
    count: { key: "members", style: "plain" },
    phase: "Phase 10",
  },
  {
    href: "/admin/updates",
    label: "Updates",
    icon: "updates",
    phase: "Phase 11",
  },
  { href: "/admin/blog", label: "Blog", icon: "blog", phase: "Phase 8" },
  {
    href: "/admin/projects",
    label: "Projects",
    icon: "projects",
    phase: "Phase 6",
  },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    icon: "testimonials",
    count: { key: "pendingTestimonials", style: "warning" },
    phase: "Phase 11",
  },
  {
    href: "/admin/messages",
    label: "Messages",
    icon: "messages",
    count: { key: "unreadMessages", style: "accent" },
    phase: "Phase 10",
  },
  { href: "/admin/stats", label: "Stats", icon: "stats", phase: "Phase 12" },
  { href: "/admin/files", label: "Files", icon: "files", phase: "Phase 9" },
  {
    href: "/admin/branding",
    label: "Branding & Look",
    icon: "branding",
    phase: "Phase 9",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: "settings",
    phase: "Phase 9",
  },
];

/** `/admin` matches only itself; every module also matches its sub-pages. */
export function isCurrentAdmin(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
