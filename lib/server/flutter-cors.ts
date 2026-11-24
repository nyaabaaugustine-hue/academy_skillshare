import { NextResponse } from "next/server";

import { getFlutterAppOrigin } from "@/lib/flutter-app-origin";

const allowedFlutterOrigin = getFlutterAppOrigin();

/** True when `origin` is this site itself (the bundled Flutter web build). */
function isSameOrigin(request: Request, origin: string): boolean {
  try {
    const target = new URL(origin);
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
      request.headers.get("host");
    if (!host) return false;
    return target.host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/** CORS for Flutter clients only; same-origin web requests are always allowed. */
export function corsHeaders(request: Request): Headers | null {
  const origin = request.headers.get("Origin");
  const headers = new Headers();
  if (!origin) return headers;
  const allowed =
    origin === allowedFlutterOrigin ||
    (!allowedFlutterOrigin && isSameOrigin(request, origin));
  if (!allowed) return null;
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  headers.set("Access-Control-Max-Age", "600");
  headers.set("Vary", "Origin");
  return headers;
}

export function json(request: Request, body: unknown, status = 200) {
  const headers = corsHeaders(request);
  if (headers === null) {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(body, { status, headers });
}

export function optionsResponse(request: Request) {
  const headers = corsHeaders(request);
  if (headers === null) {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }
  headers.set("Cache-Control", "no-store");
  return new NextResponse(null, { status: 204, headers });
}

export function errorResponse(request: Request, error: string, status: number) {
  return json(request, { error }, status);
}
