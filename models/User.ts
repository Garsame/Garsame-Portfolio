import { Schema, type HydratedDocument, type Model } from "mongoose";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  EMAIL_PATTERN,
  RuleViolation,
  defineModel,
  explainDuplicates,
} from "./shared";

/**
 * `users` — admin only. docs/05-DATA-MODEL.md; docs/04-ADMIN.md: "Garsame is
 * the only admin. There is no public sign-up and no second role."
 *
 * That is enforced here rather than trusted to the UI: a second user cannot
 * be created at all. D-047.
 */

export interface IUser {
  email: string;
  passwordHash: string;
  name?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserMethods {
  setPassword(password: string): Promise<void>;
  checkPassword(password: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser, UserMethods>;

const userSchema = new Schema<
  IUser,
  Model<IUser, object, UserMethods>,
  UserMethods
>(
  {
    email: {
      type: String,
      required: [true, "An email address is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_PATTERN, "That is not a valid email address."],
    },
    /* Never returned by a query unless asked for with .select("+passwordHash"). */
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, trim: true },
    lastLoginAt: Date,
  },
  { timestamps: true, collection: "users" },
);

userSchema.methods.setPassword = async function (password: string) {
  this.passwordHash = await hashPassword(password);
};

userSchema.methods.checkPassword = async function (password: string) {
  if (!this.passwordHash) {
    throw new Error("Load the user with .select('+passwordHash') first.");
  }
  return verifyPassword(password, this.passwordHash);
};

userSchema.pre("validate", async function () {
  if (!this.isNew) return;
  const existing = await this.model("User").countDocuments();
  if (existing > 0) {
    throw new RuleViolation({
      email:
        "There is already an admin account. There is only ever one — update it instead.",
    });
  }
});

explainDuplicates(userSchema, {
  email: "That email address is already the admin account.",
});

export const User = defineModel<IUser, UserMethods>("User", userSchema);
