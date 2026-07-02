import { NextResponse } from "next/server";

/**
 * Lightweight in-memory rate limiter.
 *
 * Caveat: this state lives in a single server process's memory. On a
 * serverless platform that runs multiple instances (e.g. Vercel under
 * load), each instance tracks its own counts, so the effective limit can
 * be higher than configured. For this app's scale (one facility, a
 * handful of concurrent users) that's an acceptable trade-off for the
 * simplicity of not standing up Redis or a database table just for this.
 * If usage grows enough for that to matter, swap this for a
 * Supabase-backed or Redis-backed counter using the same call sites.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so this map doesn't grow forever.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key);
    }
  }, CLEANUP_INTERVAL_MS);
  // Don't let this timer keep the process alive on its own.
  cleanupTimer.unref?.();
}

function checkRateLimit(key: string, limit: number, windowMs: number) {
  ensureCleanupTimer();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Call at the top of a route handler (after auth). Returns a 429
 * NextResponse if the identifier has exceeded `limit` requests to
 * `routeKey` within `windowMs`, otherwise returns null and the handler
 * should proceed normally.
 *
 * `identifier` should be something tied to the caller — session.openid is
 * preferred since it's already required for every mutating route here.
 */
export function rateLimited(
  identifier: string,
  routeKey: string,
  limit: number,
  windowMs: number,
) {
  const { allowed, retryAfterSeconds } = checkRateLimit(
    `${routeKey}:${identifier}`,
    limit,
    windowMs,
  );

  if (allowed) return null;

  return NextResponse.json(
    {
      error: `Too many requests. Please try again in ${retryAfterSeconds}s.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
