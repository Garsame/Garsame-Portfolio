import mongoose, { type Model, type Schema } from "mongoose";

/**
 * What every model shares.
 *
 * Mongoose 9 note: pre middleware no longer receives `next`. Hooks are plain or
 * async functions and signal failure by throwing — `next(err)` is gone.
 */

/** Re-use a compiled model across Next.js hot reloads instead of recompiling. */
export function defineModel<T, Methods = object>(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: Schema<T, any, Methods>,
): Model<T, object, Methods> {
  return (
    (mongoose.models[name] as Model<T, object, Methods> | undefined) ??
    mongoose.model<T, Model<T, object, Methods>>(name, schema)
  );
}

/**
 * The position for a new item in a manually ordered list. New items go to the
 * top — docs/03-PAGES.md orders projects "newest first within the admin's
 * manual order" — and dragging then reorders from there.
 */
export async function topPosition(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: Model<any>,
  filter: Record<string, unknown> = {},
): Promise<number> {
  const first = await model
    .findOne(filter)
    .sort({ position: 1 })
    .select("position")
    .lean<{ position?: number }>();
  return typeof first?.position === "number" ? first.position - 1 : 0;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The publishing states projects and posts share — docs/05-DATA-MODEL.md. */
export const CONTENT_STATES = ["draft", "published", "archived"] as const;

/**
 * A validation failure in the same shape Mongoose's own validators produce, so
 * the admin API (Phase 6 onward) handles every rejection one way: one entry per
 * field, each with a sentence written for Garsame rather than for a developer.
 */
export class RuleViolation extends mongoose.Error.ValidationError {
  constructor(problems: Record<string, string>) {
    super();
    for (const [path, message] of Object.entries(problems)) {
      this.addError(
        path,
        new mongoose.Error.ValidatorError({ path, message, type: "rule" }),
      );
    }
    this.message = Object.values(problems).join(" ");
  }
}

/** Throw a RuleViolation if any problem was collected. */
export function assertNoProblems(problems: Record<string, string>) {
  if (Object.keys(problems).length > 0) throw new RuleViolation(problems);
}

/**
 * Turn MongoDB's raw duplicate-key error (E11000) into a RuleViolation with a
 * readable message for the field. The save hooks already check slugs and
 * emails before writing, but two requests at the same moment can both pass
 * that check; the unique index is what finally refuses one of them, and this
 * is what makes that refusal readable.
 *
 * Mongoose 9: an error handler registered with { errorHandler: true } replaces
 * the error by throwing, and passes it through by returning.
 */
export function explainDuplicates(
  schema: Schema,
  messages: Record<string, string>,
) {
  const handler = (error: unknown) => {
    const e = error as {
      code?: number;
      keyPattern?: Record<string, unknown>;
      keyValue?: Record<string, unknown>;
    };
    if (e?.code !== 11000) return;
    const field = Object.keys(e.keyPattern ?? e.keyValue ?? {})[0];
    if (field && messages[field]) {
      throw new RuleViolation({ [field]: messages[field] });
    }
  };

  /* Registered one by one: TypeScript cannot pick a post() overload for a
     union of hook names. */
  schema.post("save", { errorHandler: true }, handler);
  schema.post("insertMany", { errorHandler: true }, handler);
  for (const op of UPDATE_OPERATIONS) {
    schema.post(op, { errorHandler: true }, handler);
  }
}

const UPDATE_OPERATIONS = [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "replaceOne",
  "findOneAndReplace",
] as const;

/**
 * Block direct query updates to fields whose rules live in a save hook.
 *
 * The publish rules, the featured limits and the reading-time computation all
 * run in `pre("validate")`, which fires on `document.save()` — and NOT on
 * `Model.updateOne()` or `findOneAndUpdate()`. Without this guard a single
 * `updateOne({ state: "published" })` would publish an empty post and skip
 * every rule in docs/05-DATA-MODEL.md.
 *
 * So these fields can only change through `doc.save()`. A deliberate data
 * migration can pass `{ allowProtectedFields: true }` as a query option.
 */
export function protectFields(schema: Schema, fields: readonly string[]) {
  const touches = (update: unknown): string[] => {
    if (!update || typeof update !== "object") return [];
    const hits = new Set<string>();
    for (const [key, value] of Object.entries(update)) {
      if (key.startsWith("$") && value && typeof value === "object") {
        for (const inner of Object.keys(value)) {
          const root = inner.split(".")[0];
          if (fields.includes(root)) hits.add(root);
        }
      } else if (fields.includes(key.split(".")[0])) {
        hits.add(key.split(".")[0]);
      }
    }
    return [...hits];
  };

  for (const op of UPDATE_OPERATIONS) {
    schema.pre(op, function (this: mongoose.Query<unknown, unknown>) {
      if (this.getOptions().allowProtectedFields) return;
      const hits = touches(this.getUpdate());
      if (hits.length > 0) {
        throw new Error(
          `${hits.join(", ")} can only be changed by loading the document and calling save(), so its rules run.`,
        );
      }
    });
  }

  /* Mongoose 9 passes the documents first: (docs, options). */
  schema.pre("insertMany", function (docs: unknown) {
    const list = Array.isArray(docs) ? docs : [docs];
    for (const doc of list) {
      const d = doc as Record<string, unknown>;
      if (
        d?.state === "published" ||
        d?.status === "published" ||
        d?.featured === true
      ) {
        throw new Error(
          "insertMany cannot create published or featured documents; create them and save() so the rules run.",
        );
      }
    }
  });
}

declare module "mongoose" {
  interface QueryOptions {
    /** Bypass protectFields for a deliberate data migration. */
    allowProtectedFields?: boolean;
  }
}
