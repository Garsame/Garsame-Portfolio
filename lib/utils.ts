/**
 * Join class names, dropping anything falsy.
 *
 * Deliberately not clsx or tailwind-merge — CLAUDE.md locks the stack and this
 * is the whole of what the components need.
 *
 * It only concatenates. It does NOT resolve conflicts, and Tailwind decides
 * which of two classes for the same property wins by stylesheet order, not by
 * the order they appear here. So a `className` a caller passes cannot override
 * a class the component already sets for the same property:
 *
 *   <Button className="hidden sm:inline-flex" />   // does not hide it —
 *                                                  // Button sets inline-flex
 *
 * Pass a different property, give the component a prop, or wrap it:
 *
 *   <span className="hidden sm:block"><Button /></span>
 *
 * Conflicts in one-off spacing or colour are fine, because components put
 * their own classes first and a caller's value for an unset property applies
 * cleanly. It is same-property overrides that need one of the three routes
 * above.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
