import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { getFlutterAppOrigin } from "@/lib/flutter-app-origin";
import {
  listCourseProgress,
  listCourseProgressEvents,
  parseProgressEvents,
  recordCourseProgress,
} from "@/lib/server/course-progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedFlutterOrigin = getFlutterAppOrigin();

function corsHeaders(request: Request): Headers | null {
  const origin = request.headers.get("Origin");
  const headers = new Headers();
  if (!origin) return headers;
  if (!allowedFlutterOrigin || origin !== allowedFlutterOrigin) return null;
  headers.set("Access-Control-Allow-Origin", allowedFlutterOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  headers.set("Access-Control-Max-Age", "600");
  headers.set("Vary", "Origin");
  return headers;
}

function json(request: Request, body: unknown, status = 200) {
  const headers = corsHeaders(request);
  if (headers === null) {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(body, {
    status,
    headers,
  });
}

async function signedInUser() {
  const { data, error } = await auth.getSession();
  if (error) throw error;
  const user = data?.user;
  return user && typeof user.id === "string" && user.id.length > 0
    ? { id: user.id }
    : null;
}

export async function OPTIONS(request: Request) {
  const headers = corsHeaders(request);
  if (headers === null) {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }
  headers.set("Cache-Control", "no-store");
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request: Request) {
  const headers = corsHeaders(request);
  if (headers === null) {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }
  try {
    const user = await signedInUser();
    if (!user) return json(request, { error: "unauthorized" }, 401);
    const progress = await listCourseProgress(user.id);
    const events = await listCourseProgressEvents(user.id);
    return json(request, { progress, events, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Could not read course progress.", error);
    return json(request, { error: "progress_unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  const headers = corsHeaders(request);
  if (headers === null) {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: "Send a JSON body." }, 400);
  }
  const parsed = parseProgressEvents(body);
  if ("error" in parsed) return json(request, { error: parsed.error }, 400);

  try {
    const user = await signedInUser();
    if (!user) return json(request, { error: "unauthorized" }, 401);
    const result = await recordCourseProgress(user.id, parsed.events);
    return json(request, result, 200);
  } catch (error) {
    console.error("Could not save course progress.", error);
    return json(request, { error: "progress_unavailable" }, 503);
  }
}
