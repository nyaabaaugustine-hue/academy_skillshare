import { NextResponse } from "next/server";

import { getFlutterAppOrigin } from "@/lib/flutter-app-origin";

/**
 * Same-origin proxy for the Cloudflare tutor Worker.
 *
 * The Worker URL stays server-side; the browser or app only needs this site's
 * origin. The Worker still verifies the learner's JWT on every call.
 *
 * Two rules matter here:
 *  1. CORS is checked exactly like `/api/auth` and `/api/progress`. Without an
 *     `Access-Control-Allow-Origin` the Flutter web build (served from
 *     `FLUTTER_APP_ORIGIN`) could never pass its preflight, so every AI answer
 *     silently fell back to the offline tutor in the browser.
 *  2. Only the four tutor routes are proxied, matched exactly. A prefix check
 *     over a joined path let `v1/tutor/../../guardian-report` through and turned
 *     this into an open relay to the Worker's other endpoints.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The Worker origin, e.g. https://skillbridge-tutor.<account>.workers.dev
//
// `TUTOR_WORKER_URL` overrides this. The default is deliberate: the Worker URL
// is public (not a secret), and without it a deployment that never set the env
// var answered every tutor request with `tutor_unavailable`, so the app silently
// fell back to the offline brain. `||` (not `??`) so an empty value also falls
// back rather than disabling the tutor.
const DEFAULT_TUTOR_WORKER_URL =
  "https://skillbridge-tutor.skillsbridg-academy.workers.dev";
const WORKER_URL = (process.env.TUTOR_WORKER_URL || DEFAULT_TUTOR_WORKER_URL)
  .trim()
  .replace(/\/+$/, "");

// Exact origin of the Flutter web build (the same value /api/progress uses).
const LEARN_ORIGIN = getFlutterAppOrigin();

const ALLOWED_TARGETS = new Set([
  "v1/tutor/chat",
  "v1/tutor/chat/stream",
  "v1/tutor/vision",
  "v1/tutor/resources",
]);

// Vision accepts up to 3 MiB of JSON (2 MiB image, base64-encoded).
const MAX_BODY_BYTES = 3 * 1024 * 1024 + 8192;
const UPSTREAM_TIMEOUT_MS = 25_000;

const siteOrigins = (request: Request): string[] => {
  const site = new URL(request.url).origin;
  return LEARN_ORIGIN && LEARN_ORIGIN !== site ? [site, LEARN_ORIGIN] : [site];
};

/** `null` = native caller with no Origin, `""` = rejected, else the origin. */
const allowedOrigin = (request: Request): string | null => {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  return siteOrigins(request).includes(origin) ? origin : "";
};

function withCors(request: Request, response: Response): Response {
  const origin = allowedOrigin(request);
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization",
  );
  headers.set("Access-Control-Max-Age", "600");
  headers.set("Vary", "Origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(request: Request, body: unknown, status: number): Response {
  return withCors(
    request,
    NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    }),
  );
}

const forwardedHeaders = (request: Request): Headers => {
  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  headers.set(
    "content-type",
    request.headers.get("content-type") ?? "application/json",
  );
  headers.set("accept", request.headers.get("accept") ?? "application/json");
  return headers;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  if (allowedOrigin(request) === "") {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }

  const { path } = await context.params;
  const segments = path ?? [];
  const malformed = segments.some(
    (segment) =>
      !segment ||
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\"),
  );
  const target = segments.join("/");
  if (malformed || !ALLOWED_TARGETS.has(target)) {
    return json(request, { error: "not_found" }, 404);
  }

  if (!WORKER_URL) {
    // Configuration error, not an outage: log it server-side and keep the
    // response generic so the client cannot fingerprint the deployment.
    console.error("tutor_proxy_misconfigured");
    return json(request, { error: "tutor_unavailable" }, 503);
  }

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BODY_BYTES) {
    return json(request, { error: "payload_too_large" }, 413);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(`${WORKER_URL}/${target}`, {
      method: "POST",
      headers: forwardedHeaders(request),
      body,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    console.error("tutor_proxy_unreachable", target);
    return json(request, { error: "tutor_unreachable" }, 502);
  } finally {
    // Headers have arrived, so the timeout has done its job. The SSE body may
    // legitimately keep streaming well past this point.
    clearTimeout(timer);
  }

  const headers = new Headers();
  headers.set(
    "content-type",
    upstream.headers.get("content-type") ?? "application/json",
  );
  headers.set("cache-control", "no-store");
  // Preserve the rate-limit hint so the app can tell the learner when to retry.
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) headers.set("retry-after", retryAfter);

  return withCors(
    request,
    new Response(upstream.body, { status: upstream.status, headers }),
  );
}

export async function OPTIONS(request: Request): Promise<Response> {
  if (allowedOrigin(request) === "") {
    return new NextResponse(null, { status: 403 });
  }
  return withCors(request, new NextResponse(null, { status: 204 }));
}
