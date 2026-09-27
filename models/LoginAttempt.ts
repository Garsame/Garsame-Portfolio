import { createHash } from "node:crypto";
import { Schema } from "mongoose";
import { defineModel } from "./shared";

/**
 * `loginattempts` — failed admin sign-ins, for the lockout.
 *
 * design/20-admin-login.html: "Five failed attempts locks this page for fifteen
 * minutes." Not in docs/05-DATA-MODEL.md, because it is security plumbing
 * rather than site data — D-059.
 *
 * Kept in MongoDB rather than in memory so the count survives a restart and is
 * shared between processes when PM2 runs more than one (Phase 13).
 *
 * The client's IP is never stored. The key is a hash of the IP and
 * AUTH_SECRET, which is enough to count attempts from one place and useless to
 * anyone reading the collection. Each record deletes itself after fifteen
 * minutes through a TTL index.
 */

export const LOCKOUT_ATTEMPTS = 5;
export const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

export interface ILoginAttempt {
  key: string;
  createdAt: Date;
}

const loginAttemptSchema = new Schema<ILoginAttempt>(
  {
    key: { type: String, required: true },
    /* `expires` makes this a TTL index. MongoDB sweeps expired documents about
       once a minute, so the lockout check also filters by time and never
       relies on the sweep having run. */
    createdAt: {
      type: Date,
      required: true,
      default: () => new Date(),
      expires: LOCKOUT_WINDOW_MS / 1000,
    },
  },
  { collection: "loginattempts", versionKey: false },
);

loginAttemptSchema.index({ key: 1, createdAt: -1 });

export const LoginAttempt = defineModel<ILoginAttempt>(
  "LoginAttempt",
  loginAttemptSchema,
);

/** A stable, non-reversible key for one client. */
export function attemptKey(ip: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  return createHash("sha256")
    .update(`${ip}|${secret}`)
    .digest("base64url")
    .slice(0, 32);
}

export async function recentFailures(key: string): Promise<number> {
  return LoginAttempt.countDocuments({
    key,
    createdAt: { $gt: new Date(Date.now() - LOCKOUT_WINDOW_MS) },
  });
}

export async function recordFailure(key: string): Promise<number> {
  await LoginAttempt.create({ key });
  return recentFailures(key);
}

export async function clearFailures(key: string): Promise<void> {
  await LoginAttempt.deleteMany({ key });
}
