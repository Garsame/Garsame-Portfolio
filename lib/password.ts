import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Admin password hashing — Node's built-in scrypt, no dependency.
 *
 * Parameters follow the OWASP password storage guidance for scrypt:
 * N = 2^17, r = 8, p = 1. That needs about 128MB for the few hundred
 * milliseconds a hash takes, which is fine for a single admin who logs in
 * rarely, and is exactly what makes a stolen hash expensive to attack.
 *
 * Stored self-describing, `scrypt$N$r$p$salt$hash`, so the parameters can be
 * raised later without breaking passwords already stored — verify reads them
 * back out of the hash rather than assuming today's values.
 */

const N = 2 ** 17;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
/* scrypt needs 128 · N · r bytes; Node's 32MB default is too small for N=2^17. */
const MAX_MEMORY = 256 * 1024 * 1024;

function derive(
  password: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number,
  keyLength: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),
      salt,
      keyLength,
      { N: n, r, p, maxmem: MAX_MEMORY },
      (err, key) => (err ? reject(err) : resolve(key)),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12) {
    throw new Error("The admin password must be at least 12 characters.");
  }
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, N, R, P, KEY_LENGTH);
  return [
    "scrypt",
    N,
    R,
    P,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

declare global {
  var _dummyPasswordHash: Promise<string> | undefined;
}

/**
 * A hash of random bytes nobody knows, made with exactly the parameters above.
 * Sign-in checks the password against it when the email is not the admin's, so
 * a wrong email takes as long as a wrong password and response time does not
 * reveal which addresses exist.
 *
 * One per server process, parked on globalThis like the database connection,
 * and started by instrumentation.ts as the server boots. Next.js loads a
 * separate copy of this module for each route, and a copy that made its own on
 * first use would answer its first unknown email twice as slowly.
 */
export function dummyHash(): Promise<string> {
  return (globalThis._dummyPasswordHash ??= hashPassword(
    randomBytes(32).toString("base64url"),
  ));
}

/** Constant-time comparison. False, never a throw, for a malformed hash. */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltText, hashText] = parts;
  const expected = Buffer.from(hashText, "base64url");
  if (expected.length === 0) return false;

  try {
    const actual = await derive(
      password,
      Buffer.from(saltText, "base64url"),
      Number(n),
      Number(r),
      Number(p),
      expected.length,
    );
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
