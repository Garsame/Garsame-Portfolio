import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * Runs once as the server starts — Next.js instrumentation.
 *
 * Makes the sign-in's dummy password hash (lib/password.ts) now, so the first
 * unknown email after a restart does not pay for it and answer slowly. Only in
 * the Node.js runtime, and not during the build, which has no sign-ins.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return;
  const { dummyHash } = await import("./lib/password");
  void dummyHash();
}
