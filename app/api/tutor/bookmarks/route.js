import { NextResponse } from "next/server";
import { tryDb } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request) {
  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200);
  if (!userId) return json({ error: "missing_user_id" }, 400);

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
  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const { user_id, history_id, title, note } = payload || {};
  if (!user_id || !history_id) return json({ error: "missing_fields" }, 400);

  try {
    const [row] = await sql`
      insert into tutor_bookmarks (user_id, history_id, title, note)
      values (${user_id}, ${history_id}, ${title ?? null}, ${note ?? null})
      returning id, user_id, history_id, title, note, created_at
    `;
    return json({ ok: true, bookmark: row }, 201);
  } catch (e) {
    return json({ error: e?.message || "insert_failed" }, 500);
  }
}

export async function DELETE(request) {
  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const user_id = searchParams.get("user_id");
  if (!id || !user_id) return json({ error: "missing_id_or_user" }, 400);

  try {
    await sql`delete from tutor_bookmarks where id = ${id} and user_id = ${user_id}`;
    return json({ ok: true, deleted: id });
  } catch (e) {
    return json({ error: e?.message || "delete_failed" }, 500);
  }
}
