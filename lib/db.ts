import mongoose from "mongoose";

/**
 * Cached MongoDB connection.
 *
 * Next.js reloads modules on every edit in development and runs many
 * serverless-style invocations in production. Without a cache each one opens
 * its own connection and the database runs out of them. The connection and the
 * in-flight promise are both parked on globalThis so that concurrent callers
 * share one handshake rather than racing to start several.
 */

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis._mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis._mongooseCache = cached;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.",
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      // Fail fast instead of queueing operations against a dead connection —
      // a hung request is harder to diagnose than a clear error.
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Clear the promise so the next call retries rather than awaiting a
    // rejected promise for the life of the process.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
