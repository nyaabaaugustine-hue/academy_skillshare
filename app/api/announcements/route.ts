import { errorResponse, json, optionsResponse } from "@/lib/server/flutter-cors";
import { signedInUserId } from "@/lib/server/flutter-auth";
import { decodeCursor, listAnnouncements } from "@/lib/server/announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedLimit = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(100, Math.max(1, Math.trunc(requestedLimit)))
    : 20;
  const cursor = decodeCursor(url.searchParams.get("cursor"));

  try {
    const userId = await signedInUserId();
    if (!userId) return errorResponse(request, "unauthorized", 401);
    const result = await listAnnouncements(userId, limit, cursor);
    return json(request, result);
  } catch (error) {
    console.error("Could not list announcements.", error);
    return errorResponse(request, "announcements_unavailable", 503);
  }
}
