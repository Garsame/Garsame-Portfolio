import type { AdminIcon } from "@/lib/admin/nav";

/**
 * Admin icons, traced from design/21-admin-dashboard.html and
 * design/20-admin-login.html. They draw with currentColor; the parent sets the
 * colour from a token.
 *
 * The settings gear in the design file is cut off part-way through its path;
 * this is the complete gear it was drawn from.
 */

type Props = { size?: number; className?: string; strokeWidth?: number };

function Svg({
  size = 17,
  strokeWidth = 1.8,
  className,
  children,
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const MODULE_PATHS: Record<AdminIcon, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </>
  ),
  members: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </>
  ),
  updates: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  blog: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </>
  ),
  projects: (
    <>
      <rect x="2" y="4" width="20" height="15" rx="2" />
      <path d="M2 9h20" />
    </>
  ),
  testimonials: <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />,
  messages: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </>
  ),
  stats: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  files: <path d="M4 4h6l2 3h8v13H4z" />,
  branding: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
};

export function ModuleIcon({ icon, ...props }: Props & { icon: AdminIcon }) {
  return <Svg {...props}>{MODULE_PATHS[icon]}</Svg>;
}

/* ------------------------------------------------ attention list, login */

export const AlertTriangle = (p: Props) => (
  <Svg size={16} strokeWidth={2} {...p}>
    <path d="M12 9v4M12 17v.01M10.3 3.9L2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </Svg>
);

export const MailIcon = (p: Props) => (
  <Svg size={16} strokeWidth={2} {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M22 6l-10 7L2 6" />
  </Svg>
);

export const AlertCircle = (p: Props) => (
  <Svg size={16} strokeWidth={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4M12 16v.01" />
  </Svg>
);

export const ClockIcon = (p: Props) => (
  <Svg size={16} strokeWidth={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Svg>
);

export const LockIcon = (p: Props) => (
  <Svg size={15} {...p}>
    <rect x="4" y="10" width="16" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const EyeIcon = (p: Props) => (
  <Svg size={17} strokeWidth={1.7} {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const EyeOffIcon = (p: Props) => (
  <Svg size={17} strokeWidth={1.7} {...p}>
    <path d="M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
    <path d="M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const MenuIcon = (p: Props) => (
  <Svg size={20} {...p}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Svg>
);

export const CloseIcon = (p: Props) => (
  <Svg size={20} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

/* ------------------------------------------------------- projects module */

/** The six-dot drag handle — design/27-admin-projects-list.html. */
export const GripIcon = (p: Props) => (
  <Svg size={16} strokeWidth={2} {...p}>
    <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" />
  </Svg>
);

export const InfoIcon = (p: Props) => (
  <Svg size={16} strokeWidth={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16v.01" />
  </Svg>
);

export const ChevronLeftIcon = (p: Props) => (
  <Svg size={15} strokeWidth={2} {...p}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
);

export const UploadIcon = (p: Props) => (
  <Svg size={15} strokeWidth={2} {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
  </Svg>
);

export const TrashIcon = (p: Props) => (
  <Svg size={15} strokeWidth={2} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Svg>
);

export const ArrowUpIcon = (p: Props) => (
  <Svg size={15} strokeWidth={2} {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);

export const ArrowDownIcon = (p: Props) => (
  <Svg size={15} strokeWidth={2} {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Svg>
);

export const SearchIcon = (p: Props) => (
  <Svg size={15} strokeWidth={2} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </Svg>
);

export const CopyIcon = (p: Props) => (
  <Svg size={15} strokeWidth={2} {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Svg>
);

