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
  const userId = await currentUserId();
  if (!userId) return json({ error: "unauthorized" }, 401);

  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const role = payload?.role;
  const message = payload?.message;
  if (!role || !message) return json({ error: "missing_fields" }, 400);
  if (!["user", "assistant", "system"].includes(role)) return json({ error: "invalid_role" }, 400);

  try {
    const [row] = await sql`
      insert into tutor_history (user_id, role, message, mode, metadata)
      values (${userId}, ${role}, ${String(message).slice(0, 20000)}, ${payload?.mode ? String(payload.mode).slice(0, 40) : null}, ${JSON.stringify(payload?.metadata ?? {})})
      returning id, user_id, role, message, mode, metadata, created_at
    `;
    return json({ ok: true, history: row }, 201);
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
    await sql`delete from tutor_history where id = ${id} and user_id = ${userId}`;
    return json({ ok: true, deleted: id });
  } catch (e) {
    return json({ error: e?.message || "delete_failed" }, 500);
  }
}
