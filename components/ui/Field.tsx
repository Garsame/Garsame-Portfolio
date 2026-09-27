import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "./icons";

/**
 * Form primitives.
 *
 * Measured from design/10-contact.html: a 7px gap between label and control,
 * labels at 13px/600 in --color-ink-3, controls with a 1px border, an 8px
 * radius and 15px/16px padding.
 *
 * Every control takes an `error` string. Client validation is convenience
 * only — CLAUDE.md rule 7 puts the real check on the server — so these render
 * whatever message the server sends back, and set aria-invalid with it.
 */

/* ---------------------------------------------------------------- FormField */

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  size = "md",
  aside,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** `sm` is the admin editor — a 12px label, 6px above the control. */
  size?: FieldSize;
  /** Shown at the end of the label row — a character count, say. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const small = size === "sm";
  return (
    <div
      className={cn(
        "flex flex-col",
        small ? "gap-field-gap-sm" : "gap-field-gap",
        className,
      )}
    >
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor={htmlFor}
            className={cn(
              "font-semibold text-ink-3",
              small ? "text-fine" : "text-caption",
            )}
          >
            {label}
            {required ? (
              <span className="text-danger" aria-hidden="true">
                {" *"}
              </span>
            ) : null}
          </label>
          {aside}
        </div>
      ) : null}

      {children}

      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          role="alert"
          className="text-caption text-danger"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={htmlFor ? `${htmlFor}-hint` : undefined}
          className="text-caption text-muted"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- the controls */

/* `field` is shared by Input, Textarea and Select so the three cannot drift
   apart. On a tint panel the control is white; on a white panel it is
   --color-field. Pass tone to switch. */
const field =
  "w-full rounded-input border text-ink placeholder:text-muted transition-button outline-none";

export type FieldSize = "md" | "sm";

/* The public forms (design/10-contact) and the admin editor
   (design/28-admin-project-editor) draw different field sizes. A prop, since
   `cn` cannot override padding the component sets — D-022. */
const fieldSize: Record<FieldSize, string> = {
  md: "px-field-x py-field-y text-small",
  sm: "px-field-sm-x py-field-sm-y text-caption",
};

const fieldTone = {
  white: "border-border bg-white",
  field: "border-border bg-field",
} as const;

const fieldState = {
  normal: "focus-visible:border-blue",
  error: "border-danger",
} as const;

type Tone = keyof typeof fieldTone;

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className" | "size"
> & {
  error?: string;
  tone?: Tone;
  size?: FieldSize;
  className?: string;
};

export function Input({
  error,
  tone = "white",
  size = "md",
  className,
  id,
  ...rest
}: InputProps) {
  return (
    <input
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={error && id ? `${id}-error` : undefined}
      className={cn(
        field,
        fieldSize[size],
        fieldTone[tone],
        error ? fieldState.error : fieldState.normal,
        className,
      )}
      {...rest}
    />
  );
}

type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
> & {
  error?: string;
  tone?: Tone;
  size?: FieldSize;
  className?: string;
};

export function Textarea({
  error,
  tone = "white",
  size = "md",
  className,
  id,
  rows = 5,
  ...rest
}: TextareaProps) {
  return (
    <textarea
      id={id}
      rows={rows}
      aria-invalid={error ? true : undefined}
      aria-describedby={error && id ? `${id}-error` : undefined}
      className={cn(
        field,
        fieldSize[size],
        fieldTone[tone],
        error ? fieldState.error : fieldState.normal,
        "resize-y leading-normal",
        className,
      )}
      {...rest}
    />
  );
}

type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "className" | "size"
> & {
  error?: string;
  tone?: Tone;
  size?: FieldSize;
  className?: string;
  children: React.ReactNode;
};

/**
 * The native select, with the chevron from the design drawn over it.
 *
 * Native rather than a custom listbox: it is keyboard and screen-reader
 * correct for free, and on a Somali phone it opens the platform picker instead
 * of downloading JavaScript to imitate one.
 */
export function Select({
  error,
  tone = "white",
  size = "md",
  className,
  id,
  children,
  ...rest
}: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && id ? `${id}-error` : undefined}
        className={cn(
          field,
          fieldSize[size],
          fieldTone[tone],
          error ? fieldState.error : fieldState.normal,
          "appearance-none pr-11",
          /* A native select shows its disabled "Choose one" option in the
             control's own ink colour, so it reads as a chosen value rather
             than a placeholder. Muted while the empty option is selected, to
             match the text inputs beside it; the open list stays ink. */
          "[&_option]:text-ink [&:has(option[value='']:checked)]:text-muted",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-field-x -translate-y-1/2 text-muted" />
    </div>
  );
}

/* ----------------------------------------------------------------- Checkbox */

/**
 * The consent checkbox from design/08-testimonials.html: an 18px box with a
 * 4px radius, offset 2px so it aligns with the first line of a wrapping label.
 *
 * The real input stays in the DOM and is only visually hidden, so it remains
 * focusable and announced; the visible box is drawn from its checked state.
 */
export function Checkbox({
  label,
  id,
  error,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "type"> & {
  label: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-field-gap", className)}>
      <label
        htmlFor={id}
        className="group flex cursor-pointer items-start gap-check-gap"
      >
        <span className="relative mt-0.5 shrink-0">
          <input
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={error && id ? `${id}-error` : undefined}
            className="peer size-check appearance-none rounded-check border border-blue-wash bg-white transition-button checked:border-blue checked:bg-blue"
            {...rest}
          />
          <Check className="pointer-events-none absolute inset-0 m-auto hidden text-white peer-checked:block" />
        </span>
        <span className="text-caption leading-normal text-ink-body">
          {label}
        </span>
      </label>

      {error ? (
        <p
          id={id ? `${id}-error` : undefined}
          role="alert"
          className="text-caption text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
