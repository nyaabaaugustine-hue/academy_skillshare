import { NextResponse } from "next/server";

import { assertAdmin } from "@/lib/admin-auth";
import {
  createAnnouncement,
  deleteDeviceTokens,
  listDeviceTokens,
  listRecentAnnouncements,
} from "@/lib/server/announcements";
import { fcmEnabled, sendAnnouncement } from "@/lib/server/fcm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function GET() {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;
  try {
    const items = await listRecentAnnouncements(50);
    return NextResponse.json({ items, pushEnabled: fcmEnabled() });
  } catch (error) {
    console.error("Could not list admin announcements.", error);
    return fail("announcements_unavailable", 503);
  }
}

export async function POST(request: Request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  let body: { title?: unknown; body?: unknown; audience?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("invalid_json", 400);
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";
  const audience = typeof body.audience === "string" && body.audience ? body.audience : "all";
  if (!title || title.length > 180 || !message || message.length > 4000) {
    return fail("invalid_announcement", 400);
  }

  try {
    const announcement = await createAnnouncement({
      title,
      body: message,
      audience,
      createdBy: "admin",
    });
    const tokens = await listDeviceTokens();
    const result = await sendAnnouncement(tokens, {
      announcementId: announcement.id,
      title,
      body: message,
    });
    if (result.invalidTokens.length > 0) {
      await deleteDeviceTokens(result.invalidTokens);
    }
    return NextResponse.json(
      { id: announcement.id, sent: result.sent, pushEnabled: result.enabled },
      { status: 201 },
    );
  } catch (error) {
    console.error("Could not publish announcement.", error);
    return fail("announcement_unavailable", 503);
  }
}
