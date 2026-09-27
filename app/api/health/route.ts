import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "disconnected";
  let isDbHealthy = false;

  try {
    await dbConnect();
    const readyState = mongoose.connection.readyState;
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    if (readyState === 1) {
      dbStatus = "connected";
      isDbHealthy = true;
    } else if (readyState === 2) {
      dbStatus = "connecting";
    } else {
      dbStatus = "disconnected";
    }
  } catch (err) {
    dbStatus = `error: ${err instanceof Error ? err.message : String(err)}`;
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = isDbHealthy;

  const payload = {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      name: mongoose.connection.name || "unknown",
      host: mongoose.connection.host || "unknown",
      readyState: mongoose.connection.readyState,
    },
    responseTimeMs,
    version: "3.0.0",
  };

  return NextResponse.json(payload, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
