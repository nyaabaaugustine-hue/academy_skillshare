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
      select id, user_id, role, message, mode, metadata, created_at
      from tutor_history
      where user_id = ${userId}
      order by created_at desc
      limit ${limit}
    `;
    return json({ ok: true, history: rows.reverse() });
  } catch (e) {
    return json({ error: e?.message || "query_failed" }, 500);
  }
}

export async function POST(request) {
  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const { user_id, role, message, mode, metadata } = payload || {};
  if (!user_id || !role || !message) return json({ error: "missing_fields" }, 400);
  if (!["user", "assistant", "system"].includes(role)) return json({ error: "invalid_role" }, 400);

  try {
    const [row] = await sql`
      insert into tutor_history (user_id, role, message, mode, metadata)
      values (${user_id}, ${role}, ${message}, ${mode ?? null}, ${JSON.stringify(metadata ?? {})})
      returning id, user_id, role, message, mode, metadata, created_at
    `;
    return json({ ok: true, history: row }, 201);
  } catch (e) {
    return json({ error: e?.message || "insert_failed" }, 500);
  }
}
