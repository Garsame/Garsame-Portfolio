import { cn } from "@/lib/utils";

/**
 * The on/off switch — design/27-admin-projects-list.html and
 * design/28-admin-project-editor.html: a 36 × 20 pill with a 16px knob, blue
 * when on.
 *
 * A real button with role="switch", so it is announced as on or off and
 * toggles with Space and Enter. The drawn pill is 20px tall; the button around
 * it is 44px, the minimum tap target in docs/02-DESIGN-SYSTEM.md.
 */
export function Switch({
  checked,
  onChange,
  label,
  showLabel = false,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Always given — read aloud, and shown beside the pill when showLabel. */
  label: string;
  showLabel?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-pill p-0.5 transition-button",
          checked ? "justify-end bg-blue" : "justify-start bg-border",
        )}
      >
        <span className="size-4 rounded-full bg-white" />
      </span>
      {showLabel ? (
        <span
          className={cn(
            "text-fine font-semibold",
            checked ? "text-blue" : "text-muted",
          )}
        >
          {label}
        </span>
      ) : null}
    </button>
  );
}
