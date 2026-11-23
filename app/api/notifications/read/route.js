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

  const ids = Array.isArray(payload?.ids) ? payload.ids.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0) : [];
  const markAll = Boolean(payload?.all);

  try {
    if (markAll) {
      await sql`update notifications set read_at = now() where user_id = ${userId} and read_at is null`;
    } else if (ids.length) {
      await sql`update notifications set read_at = now() where user_id = ${userId} and id = any(${ids}) and read_at is null`;
    } else {
      return json({ error: "missing_ids_or_all" }, 400);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: e?.message || "update_failed" }, 500);
  }
}
