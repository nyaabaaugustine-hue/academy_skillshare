import "server-only";

/**
 * Best-effort fixed-window rate limiter for public write endpoints.
 *
 * Runs in the Node.js runtime, so the counters live in the instance's memory:
 * they do NOT coordinate across Vercel's parallel instances. It is a cheap
 * abuse floor (one client cannot hammer a single instance), not a hard
 * guarantee. If a durable limit is ever needed, back it with Postgres or the
 * Tutor Worker's Durable Object limiter.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

// Sweep threshold: keeps the map from growing without bound on a busy instance.
const MAX_KEYS = 10_000;

export type RateLimitOptions = { limit: number; windowMs: number };

export type RateLimitResult = {
  ok: boolean;
  /** Requests left in the current window (0 once blocked). */
  remaining: number;
  /** Whole seconds until the window resets; only useful when `ok` is false. */
  retryAfterSeconds: number;
};

export function rateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  if (windows.size > MAX_KEYS) {
    for (const [k, w] of windows) {
      if (w.resetAt <= now) windows.delete(k);
    }
  }

  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { ok: true, remaining: limit - current.count, retryAfterSeconds: 0 };
}

/** Best-effort client identity: prefers the Vercel-forwarded client IP. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
