import { errorResponse, json, optionsResponse } from "@/lib/server/flutter-cors";
import { signedInUserId } from "@/lib/server/flutter-auth";
import { markAnnouncementRead } from "@/lib/server/announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function OPTIONS(request: Request) {
  return optionsResponse(request);
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  if (!id) return errorResponse(request, "invalid_id", 400);

  try {
    const userId = await signedInUserId();
    if (!userId) return errorResponse(request, "unauthorized", 401);
    await markAnnouncementRead(id, userId);
    return json(request, { ok: true });
  } catch (error) {
    console.error("Could not mark announcement read.", error);
    return errorResponse(request, "announcement_unavailable", 503);
  }
}
