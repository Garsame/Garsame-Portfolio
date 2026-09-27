import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { dbConnect } from "./lib/db";
import { dummyHash, verifyPassword } from "./lib/password";
import {
  LOCKOUT_ATTEMPTS,
  User,
  attemptKey,
  clearFailures,
  recentFailures,
  recordFailure,
} from "./models";

/**
 * Auth.js — docs/06-BUILD-PROMPTS.md Phase 5: "NextAuth with a credentials
 * provider against the users collection."
 *
 * One admin, signed in with email and password. The lockout from
 * design/20-admin-login.html — five failed attempts locks sign-in for fifteen
 * minutes — is enforced here, before a password is ever checked, so a locked
 * client cannot keep testing guesses.
 */

/** Wrong email or password. Deliberately one message for both. */
class InvalidCredentials extends CredentialsSignin {
  code = "invalid";
}

/** Too many failures from this client. */
class LockedOut extends CredentialsSignin {
  code = "locked";
}

/**
 * The client's address, for the lockout.
 *
 * The LAST entry of X-Forwarded-For, not the first. A visitor can send their
 * own X-Forwarded-For; Nginx's usual `$proxy_add_x_forwarded_for` appends the
 * real address after it. Taking the first entry would let anyone dodge the
 * lockout by inventing a new address per attempt. The last entry is the one
 * our own proxy wrote. D-064.
 */
function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  if (last) return last;
  return request.headers.get("x-real-ip")?.trim() || "local";
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { type: "email", label: "Email" },
        password: { type: "password", label: "Password" },
      },

      async authorize(credentials, request) {
        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string" ? credentials.password : "";

        await dbConnect();
        const key = attemptKey(clientIp(request));

        if ((await recentFailures(key)) >= LOCKOUT_ATTEMPTS) {
          throw new LockedOut();
        }

        const user =
          email && password
            ? await User.findOne({ email }).select("+passwordHash")
            : null;

        /* No such admin: check the password anyway, against a hash nobody
           knows, so the answer takes the same time. lib/password.ts. */
        const valid = user
          ? await user.checkPassword(password)
          : (await verifyPassword(password, await dummyHash()), false);

        if (!user || !valid) {
          const failures = await recordFailure(key);
          throw failures >= LOCKOUT_ATTEMPTS
            ? new LockedOut()
            : new InvalidCredentials();
        }

        await clearFailures(key);
        /* timestamps: false — `updatedAt` marks the last real change to the
           account, which lib/dal.ts compares with the session's sign-in time. */
        await User.updateOne(
          { _id: user._id },
          { lastLoginAt: new Date() },
          { timestamps: false },
        );

        return {
          id: String(user._id),
          email: user.email,
          name: user.name ?? null,
        };
      },
    }),
  ],
});
