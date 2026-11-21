import { auth } from "@/lib/auth/server";
import { getFlutterAppOrigin } from "@/lib/flutter-app-origin";

const allowedOrigin = getFlutterAppOrigin();
type AuthHandlers = ReturnType<typeof auth.handler>;
type AuthRouteContext = { params: Promise<{ path: string[] }> };

let _handlers: AuthHandlers | null = null;
function getHandlers(): AuthHandlers {
  if (!_handlers) _handlers = auth.handler();
  return _handlers;
}

function hostOf(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return "";
  }
}

/**
 * True when `origin` is the origin this website is served from.
 *
 * A same-origin call is not a CORS request, so it must never depend on
 * FLUTTER_APP_ORIGIN being configured — that variable exists to admit the
 * *Flutter web bundle*, which is a different origin. Without this, the site's
 * own sign-in page is rejected with 403 whenever the variable is unset.
 */
function isSameOrigin(request: Request, origin: string): boolean {
  const originHost = hostOf(origin);
  if (!originHost) return false;
  const candidates = [
    hostOf(request.url),
    request.headers.get("x-forwarded-host") ?? "",
    request.headers.get("host") ?? "",
  ];
  return candidates.some((candidate) => {
    const host = candidate.split(",")[0]?.trim();
    return Boolean(host) && host === originHost;
  });
}

/**
 * The origin Neon Auth itself trusts: its own host. Neon Auth only accepts
 * requests whose `Origin` is one of its trusted domains (its own host plus any
 * configured app origins), and the proxy in `@neon/auth` forwards the incoming
 * `Origin` header upstream verbatim. Browsers and the Flutter app call this
 * site's `/api/auth/*`, so that origin is the *site's*, which Neon Auth rejects
 * with `INVALID_ORIGIN` unless it has been added to the trusted-domain list.
 *
 * Rewriting the forwarded `Origin` to Neon Auth's own host removes that second
 * gate without weakening this route: the browser-facing check in `withCors`
 * still runs on the *original* `Origin` and rejects anything outside
 * FLUTTER_APP_ORIGIN / same-origin, and a browser cannot forge `Origin`.
 */
function neonAuthOrigin(): string {
  try {
    const origin = new URL(process.env.NEON_AUTH_BASE_URL ?? "").origin;
    return origin === "null" ? "" : origin;
  } catch {
    return "";
  }
}

async function withTrustedOrigin(request: Request): Promise<Request> {
  const trusted = neonAuthOrigin();
  if (!trusted) return request;
  const headers = new Headers(request.headers);
  // The rewritten request carries the same body, so a stale Content-Length
  // could describe the wrong byte count; let the runtime recompute it.
  headers.delete("content-length");
  headers.set("origin", trusted);
  // Rebuild from primitives: `new Request(nextRequest, …)` trips over Next's
  // private request state, and a buffered body avoids the stream `duplex`
  // requirement. Request bodies here are small JSON payloads.
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;
  return new Request(request.url, {
    method: request.method,
    headers,
    body,
  });
}

function corsHeaders(origin: string): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  });
  return headers;
}

async function withCors(
  request: Request,
  invoke: () => Promise<Response>,
): Promise<Response> {
  const origin = request.headers.get("origin");
  if (!origin) return invoke();
  if (origin !== allowedOrigin && !isSameOrigin(request, origin)) {
    return Response.json({ error: "Origin not allowed" }, { status: 403 });
  }

  const response = await invoke();
  const headers = new Headers(response.headers);
  for (const [key, value] of corsHeaders(origin)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function OPTIONS(request: Request): Response {
  const origin = request.headers.get("origin");
  if (!origin || (origin !== allowedOrigin && !isSameOrigin(request, origin))) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export function GET(request: Request, context: AuthRouteContext): Promise<Response> {
  return withCors(request, async () =>
    getHandlers().GET(await withTrustedOrigin(request), context),
  );
}

export function POST(request: Request, context: AuthRouteContext): Promise<Response> {
  return withCors(request, async () =>
    getHandlers().POST(await withTrustedOrigin(request), context),
  );
}

export function PUT(request: Request, context: AuthRouteContext): Promise<Response> {
  return withCors(request, async () =>
    getHandlers().PUT(await withTrustedOrigin(request), context),
  );
}

export function PATCH(request: Request, context: AuthRouteContext): Promise<Response> {
  return withCors(request, async () =>
    getHandlers().PATCH(await withTrustedOrigin(request), context),
  );
}

export function DELETE(request: Request, context: AuthRouteContext): Promise<Response> {
  return withCors(request, async () =>
    getHandlers().DELETE(await withTrustedOrigin(request), context),
  );
}
