import mongoose, { Schema, type Types } from "mongoose";
import { RuleViolation, defineModel, explainDuplicates } from "./shared";

/**
 * `files` — docs/05-DATA-MODEL.md; docs/04-ADMIN.md §9.
 *
 * "Deleting a file is refused while `usedBy` is not empty." Enforced here, on
 * every delete path Mongoose has — document deleteOne, and the query forms
 * deleteOne, deleteMany and findOneAndDelete — so nothing in the admin can
 * remove an image a published post still points at.
 */

/** "Accepts jpg, png, webp, svg, pdf; 10MB per file." */
export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
] as const;

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export interface IFile {
  filename: string;
  originalName: string;
  mimeType: (typeof ACCEPTED_MIME_TYPES)[number];
  size: number;
  width?: number;
  height?: number;
  url: string;
  thumbUrl?: string;
  alt?: string;
  usedBy: { model: string; id: Types.ObjectId }[];
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    /* Randomised on disk — never the uploader's own filename. */
    filename: { type: String, required: true, unique: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: {
      type: String,
      required: true,
      enum: {
        values: ACCEPTED_MIME_TYPES,
        message: "Only jpg, png, webp, svg and pdf files are accepted.",
      },
    },
    size: {
      type: Number,
      required: true,
      min: 1,
      max: [MAX_FILE_BYTES, "Files can be at most 10MB."],
    },
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 },
    url: { type: String, required: true, trim: true },
    thumbUrl: { type: String, trim: true },
    alt: { type: String, trim: true, maxlength: 300 },
    usedBy: {
      type: [
        {
          _id: false,
          model: {
            type: String,
            required: true,
            enum: ["Project", "Post", "Testimonial", "Settings", "Broadcast"],
          },
          id: { type: Schema.Types.ObjectId, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true, collection: "files" },
);

fileSchema.index({ mimeType: 1, createdAt: -1 });

function inUseError(names: string[]) {
  return new RuleViolation({
    usedBy: `This file is still used by ${names.join(", ")}. Remove it there first, then delete it.`,
  });
}

const describe = (usedBy: IFile["usedBy"]) =>
  usedBy.map((u) => `${u.model.toLowerCase()} ${String(u.id)}`);

/* document.deleteOne() */
fileSchema.pre("deleteOne", { document: true, query: false }, function () {
  if (this.usedBy?.length) throw inUseError(describe(this.usedBy));
});

/* Model.deleteOne(filter), Model.deleteMany(filter), findOneAndDelete(filter) */
for (const op of ["deleteOne", "deleteMany", "findOneAndDelete"] as const) {
  fileSchema.pre(
    op,
    { document: false, query: true },
    async function (this: mongoose.Query<unknown, IFile>) {
      const blocked = await this.model
        .find({ ...this.getFilter(), "usedBy.0": { $exists: true } })
        .select("originalName usedBy")
        .lean<Pick<IFile, "originalName" | "usedBy">[]>();
      if (blocked.length > 0) {
        throw inUseError(blocked.map((f) => `"${f.originalName}"`));
      }
    },
  );
}

explainDuplicates(fileSchema, {
  filename: "A stored file already has that name on disk.",
});

/* Exported as StoredFile, not File: a `File` export would shadow the Web
   platform's File type, and the Phase 9 upload handlers need both — the
   uploaded File from FormData and this model — in the same module. The model
   name stays "File", which is what every `ref` points at. */
export const StoredFile = defineModel<IFile>("File", fileSchema);
