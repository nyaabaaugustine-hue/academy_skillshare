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

  const endpoint = String(payload?.endpoint || "").trim();
  const p256dh = String(payload?.keys?.p256dh || "").trim();
  const auth = String(payload?.keys?.auth || "").trim();
  if (!endpoint || !p256dh || !auth) return json({ error: "invalid_subscription" }, 400);

  try {
    await sql`
      insert into push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
      values (${userId}, ${endpoint}, ${p256dh}, ${auth}, ${String(payload?.userAgent || "").slice(0, 500) || null}, now())
      on conflict (endpoint) do update set
        user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        updated_at = now()
    `;
    return json({ ok: true }, 201);
  } catch (e) {
    return json({ error: e?.message || "subscribe_failed" }, 500);
  }
}

export async function DELETE(request) {
  const userId = await currentUserId();
  if (!userId) return json({ error: "unauthorized" }, 401);

  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const endpoint = String(payload?.endpoint || "").trim();
  if (!endpoint) return json({ error: "missing_endpoint" }, 400);

  try {
    await sql`delete from push_subscriptions where endpoint = ${endpoint} and user_id = ${userId}`;
    return json({ ok: true });
  } catch (e) {
    return json({ error: e?.message || "unsubscribe_failed" }, 500);
  }
}
