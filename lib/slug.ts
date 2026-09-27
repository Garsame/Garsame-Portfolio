import type { Model } from "mongoose";

/**
 * Slugs — docs/05-DATA-MODEL.md: "generated from the title and remain
 * editable; uniqueness enforced at the database level, not only in the form."
 *
 * Two different collisions are treated differently, on purpose:
 *
 * - A slug the system GENERATED from a title is silently numbered: a second
 *   post called "Mobile money" becomes `mobile-money-2`. Nobody chose that
 *   slug, so nobody is surprised by the suffix.
 * - A slug Garsame TYPED is never renumbered behind his back. If it collides,
 *   saving fails with a message saying so — docs/04-ADMIN.md, "publish is
 *   blocked with a clear message if … the slug collides."
 *
 * The unique index on each model is what actually guarantees uniqueness; the
 * check here exists to turn a raw duplicate-key error into that message.
 */

const MAX_LENGTH = 80;

/** "Can AI understand Somali?" → "can-ai-understand-somali" */
export function slugify(input: string): string {
  return (
    input
      .normalize("NFKD")
      // strip the accents that NFKD split off
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_LENGTH)
      .replace(/-+$/g, "")
  );
}

/** True for a string that is already a valid slug. */
export function isSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= MAX_LENGTH;
}

/**
 * The first free slug for `base` in `model`: `base`, then `base-2`, `base-3`…
 * `excludeId` is the document being saved, so it does not collide with itself.
 */
export async function uniqueSlug(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  base: string,
  excludeId?: unknown,
): Promise<string> {
  const root = slugify(base) || "untitled";

  for (let n = 1; n < 1000; n += 1) {
    const suffix = n === 1 ? "" : `-${n}`;
    const candidate = `${root.slice(0, MAX_LENGTH - suffix.length)}${suffix}`;
    const clash = await model.exists({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (!clash) return candidate;
  }

  throw new Error(`Could not find a free slug for "${root}".`);
}

/** True when `slug` is used by a document other than `excludeId`. */
export async function slugTaken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  slug: string,
  excludeId?: unknown,
): Promise<boolean> {
  const clash = await model.exists({
    slug,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });
  return Boolean(clash);
}
