import "server-only";

import { createHmac } from "node:crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "garsame-form-secret-key-salt";

/**
 * Creates an HMAC signed timestamp string for public form rendering.
 */
export function generateFormTimestampToken(): string {
  const ts = Date.now().toString();
  const signature = createHmac("sha256", SECRET).update(ts).digest("hex").slice(0, 16);
  return `${ts}.${signature}`;
}

export type AntiSpamCheckParams = {
  honeypot?: string | null;
  timestampToken?: string | null;
  minElapsedSeconds?: number;
  maxElapsedSeconds?: number;
};

export type AntiSpamResult = {
  passed: boolean;
  reason?: string;
};

/**
 * Validates honeypot and time-to-submit to reject automated bot spam.
 */
export function validateAntiSpam({
  honeypot,
  timestampToken,
  minElapsedSeconds = 1.5,
  maxElapsedSeconds = 7200, // 2 hours
}: AntiSpamCheckParams): AntiSpamResult {
  /* 1. Honeypot check: Bots fill hidden inputs */
  if (honeypot && honeypot.trim().length > 0) {
    return {
      passed: false,
      reason: "Honeypot triggered",
    };
  }

  /* 2. Timestamp check */
  if (!timestampToken) {
    return {
      passed: false,
      reason: "Missing submission token",
    };
  }

  const [tsStr, signature] = timestampToken.split(".");
  if (!tsStr || !signature) {
    return {
      passed: false,
      reason: "Invalid submission token format",
    };
  }

  const expectedSig = createHmac("sha256", SECRET).update(tsStr).digest("hex").slice(0, 16);
  if (signature !== expectedSig) {
    return {
      passed: false,
      reason: "Tampered submission token",
    };
  }

  const ts = Number(tsStr);
  if (isNaN(ts)) {
    return {
      passed: false,
      reason: "Malformed timestamp",
    };
  }

  const elapsedMs = Date.now() - ts;
  const elapsedSec = elapsedMs / 1000;

  if (elapsedSec < minElapsedSeconds) {
    return {
      passed: false,
      reason: "Form submitted too quickly",
    };
  }

  if (elapsedSec > maxElapsedSeconds) {
    return {
      passed: false,
      reason: "Form session expired, please refresh the page",
    };
  }

  return { passed: true };
}
