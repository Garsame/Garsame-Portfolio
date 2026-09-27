import type { NextAuthConfig } from "next-auth";

/**
 * The part of the Auth.js configuration that imports no database code.
 *
 * `proxy.ts` runs on every admin request, and only needs to read the session
 * cookie. Keeping Mongoose out of this file keeps it out of the proxy.
 * `auth.ts` adds the credentials provider, which does need the database.
 */

/** Seven days, refreshed at most once a day while in use. D-060. */
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export const authConfig = {
  pages: { signIn: "/admin/login" },
  providers: [],
  session: {
    /* The credentials provider only supports JWT sessions. The token is
       encrypted (JWE) and stored in an httpOnly cookie that is Secure in
       production — docs/04-ADMIN.md, "signed, httpOnly session cookies". */
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    jwt({ token, user }) {
      /* `user` is only present at sign-in — it is what authorize() returned.
         `authTime` is stamped then and carried unchanged afterwards.

         It deliberately is not `iat`: Auth.js re-issues a rolling session with
         a fresh `iat`, so a session stolen before a password change would pass
         an `iat` check again after its next refresh. `authTime` never moves,
         so lib/dal.ts can refuse any session older than the password. */
      if (user?.id) {
        token.sub = user.id;
        token.authTime = Math.floor(Date.now() / 1000);
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (typeof token.authTime === "number") {
        session.authTime = token.authTime;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
