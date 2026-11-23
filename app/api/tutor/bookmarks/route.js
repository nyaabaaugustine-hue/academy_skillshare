import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth/server";
import { tryDb } from "../../../../lib/db";

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

export async function GET(request) {
  const userId = await currentUserId();
  if (!userId) return json({ error: "unauthorized" }, 401);

  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200);

  try {
    const rows = await sql`
      select b.id, b.user_id, b.history_id, b.title, b.note, b.created_at,
             h.message, h.role, h.mode, h.metadata
      from tutor_bookmarks b
      join tutor_history h on h.id = b.history_id
      where b.user_id = ${userId}
      order by b.created_at desc
      limit ${limit}
    `;
    return json({ ok: true, bookmarks: rows });
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

  const historyId = payload?.history_id;
  if (!historyId) return json({ error: "missing_history_id" }, 400);

  try {
    const [row] = await sql`
      insert into tutor_bookmarks (user_id, history_id, title, note)
      values (${userId}, ${historyId}, ${payload?.title ? String(payload.title).slice(0, 160) : null}, ${payload?.note ? String(payload.note).slice(0, 1000) : null})
      returning id, user_id, history_id, title, note, created_at
    `;
    return json({ ok: true, bookmark: row }, 201);
  } catch (e) {
    return json({ error: e?.message || "insert_failed" }, 500);
  }
}

export async function DELETE(request) {
  const userId = await currentUserId();
  if (!userId) return json({ error: "unauthorized" }, 401);

  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "missing_id" }, 400);

  try {
    await sql`delete from tutor_bookmarks where id = ${id} and user_id = ${userId}`;
    return json({ ok: true, deleted: id });
  } catch (e) {
    return json({ error: e?.message || "delete_failed" }, 500);
  }
}
