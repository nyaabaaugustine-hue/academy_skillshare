import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { tryDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function currentUserId() {
  try {
    const { data: session } = await auth.getSession();
    return session?.user?.id ? String(session.user.id) : null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  const userId = await currentUserId();
  if (!userId) return json({ error: "unauthorized" }, 401);

  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const token = String(payload?.fcm_token || "").trim();
  if (!token) return json({ error: "missing_fcm_token" }, 400);
  const platform = ["android","ios","web"].includes(payload?.platform) ? payload.platform : "web";
  const deviceName = payload?.device_name ? String(payload.device_name).trim().slice(0, 120) : null;
  const appVersion = payload?.app_version ? String(payload.app_version).trim().slice(0, 40) : null;

  try {
    await sql`
      insert into user_devices (user_id, fcm_token, platform, device_name, app_version, is_active, last_seen_at, updated_at)
      values (${userId}, ${token}, ${platform}, ${deviceName}, ${appVersion}, true, now(), now())
      on conflict (fcm_token) do update set
        user_id = excluded.user_id,
        platform = excluded.platform,
        device_name = excluded.device_name,
        app_version = excluded.app_version,
        is_active = true,
        last_seen_at = now(),
        updated_at = now()
    `;
    return json({ ok: true }, 201);
  } catch (e) {
    return json({ error: e?.message || "register_failed" }, 500);
  }
}

export async function DELETE(request) {
  const userId = await currentUserId();
  if (!userId) return json({ error: "unauthorized" }, 401);

  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const token = String(payload?.fcm_token || "").trim();
  if (!token) return json({ error: "missing_fcm_token" }, 400);

  try {
    await sql`update user_devices set is_active = false, updated_at = now() where fcm_token = ${token} and user_id = ${userId}`;
    return json({ ok: true });
  } catch (e) {
    return json({ error: e?.message || "unregister_failed" }, 500);
  }
}
