import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { tryDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["general","announcement","system","account","security","reminder","promotion","education","event"];

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

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return json({ error: "unauthorized" }, 401);

  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  try {
    const rows = await sql`select category, push_enabled, in_app_enabled, updated_at from notification_preferences where user_id = ${userId}`;
    return json({ ok: true, preferences: rows });
  } catch (e) {
    return json({ error: e?.message || "query_failed" }, 500);
  }
}

export async function POST(request) {
  const userId = await currentUserId();
  if (!userId) return json({ error: "unauthorized" }, 401);

  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const category = CATEGORIES.includes(payload?.category) ? payload.category : "general";
  const pushEnabled = payload?.push_enabled !== false;
  const inAppEnabled = payload?.in_app_enabled !== false;

  try {
    await sql`
      insert into notification_preferences (user_id, category, push_enabled, in_app_enabled, updated_at)
      values (${userId}, ${category}, ${pushEnabled}, ${inAppEnabled}, now())
      on conflict (user_id, category) do update set
        push_enabled = excluded.push_enabled,
        in_app_enabled = excluded.in_app_enabled,
        updated_at = now()
    `;
    return json({ ok: true, preference: { category, push_enabled: pushEnabled, in_app_enabled: inAppEnabled } });
  } catch (e) {
    return json({ error: e?.message || "save_failed" }, 500);
  }
}
