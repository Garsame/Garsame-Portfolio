import type { DefaultSession } from "next-auth";

/* The fields this project adds to the Auth.js session and token. */

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
    /** Seconds since the epoch at sign-in. Never refreshed. See auth.config.ts. */
    authTime?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    authTime?: number;
  }
}
