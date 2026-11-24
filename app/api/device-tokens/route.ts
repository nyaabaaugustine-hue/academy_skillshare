import { errorResponse, json, optionsResponse } from "@/lib/server/flutter-cors";
import { signedInUserId } from "@/lib/server/flutter-auth";
import { deleteDeviceToken, saveDeviceToken } from "@/lib/server/announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLATFORMS = new Set(["android", "ios", "web"]);

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request) {
  let body: { token?: unknown; platform?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse(request, "invalid_json", 400);
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const platform =
    typeof body.platform === "string" && PLATFORMS.has(body.platform)
      ? body.platform
      : null;
  if (!token || token.length > 4096 || !platform) {
    return errorResponse(request, "invalid_token", 400);
  }

  try {
    const userId = await signedInUserId();
    if (!userId) return errorResponse(request, "unauthorized", 401);
    await saveDeviceToken(userId, token, platform);
    return json(request, { ok: true });
  } catch (error) {
    console.error("Could not save FCM token.", error);
    return errorResponse(request, "token_unavailable", 503);
  }
}

export async function DELETE(request: Request) {
  let body: { token?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse(request, "invalid_json", 400);
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return errorResponse(request, "invalid_token", 400);

  try {
    const userId = await signedInUserId();
    if (!userId) return errorResponse(request, "unauthorized", 401);
    await deleteDeviceToken(userId, token);
    return json(request, { ok: true });
  } catch (error) {
    console.error("Could not delete FCM token.", error);
    return errorResponse(request, "token_unavailable", 503);
  }
}
