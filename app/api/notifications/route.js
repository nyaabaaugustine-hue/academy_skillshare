import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { tryDb } from "@/lib/db";
import { sendPushToUser, sendPushToAll } from "@/lib/push";

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

async function isAdminSession() {
  // Admin auth is separate (env-based cookie). Check via admin cookie.
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const { verifySessionToken } = await import("@/lib/admin-auth");
    return verifySessionToken(jar.get("sb_admin_session")?.value);
  } catch {
    return false;
  }
}

export async function GET(request) {
  const userId = await currentUserId();
  if (!userId) return json({ error: "unauthorized" }, 401);

  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10), 1), 100);

  try {
    const rows = await sql`
      select id, title, body, type, link, read_at, created_at
      from notifications
      where user_id = ${userId}
      order by created_at desc
      limit ${limit}
    `;
    const unread = rows.filter((r) => !r.read_at).length;
    return json({ ok: true, notifications: rows, unread });
  } catch (e) {
    return json({ error: e?.message || "query_failed" }, 500);
  }
}

export async function POST(request) {
  const admin = await isAdminSession();
  if (!admin) return json({ error: "unauthorized" }, 401);

  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const title = String(payload?.title || "").trim().slice(0, 160);
  if (!title) return json({ error: "missing_title" }, 400);
  const body = payload?.body ? String(payload.body).trim().slice(0, 2000) : null;
  const type = String(payload?.type || "info").trim().slice(0, 40);
  const link = payload?.link ? String(payload.link).trim().slice(0, 500) : null;
  const userId = payload?.user_id ? String(payload.user_id).trim() : null;
  const broadcast = Boolean(payload?.broadcast);

  try {
    if (broadcast) {
      // Insert for all known users is expensive; instead store a broadcast row with user_id='*' and let clients fetch broadcasts.
      await sql`
        insert into notifications (user_id, title, body, type, link)
        values (${"*"}, ${title}, ${body}, ${type}, ${link})
      `;
      const pushResult = await sendPushToAll({ title, body, link, type });
      return json({ ok: true, broadcast: true, push: pushResult }, 201);
    }

    if (!userId) return json({ error: "missing_user_id" }, 400);
    const [row] = await sql`
      insert into notifications (user_id, title, body, type, link)
      values (${userId}, ${title}, ${body}, ${type}, ${link})
      returning id, user_id, title, body, type, link, created_at
    `;
    const pushResult = await sendPushToUser(userId, { title, body, link, type });
    return json({ ok: true, notification: row, push: pushResult }, 201);
  } catch (e) {
    return json({ error: e?.message || "insert_failed" }, 500);
  }
}
