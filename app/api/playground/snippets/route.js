import crypto from "node:crypto";
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

function shareToken() {
  return crypto.randomBytes(12).toString("hex");
}

export async function GET(request) {
  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  const { searchParams } = new URL(request.url);
  const token = (searchParams.get("token") || "").trim();
  if (!token) return json({ error: "missing_token" }, 400);

  try {
    const rows = await sql`
      select id, title, code, stdin, language, share_token, is_public, created_at
      from playground_snippets
      where share_token = ${token} and is_public = true
      limit 1
    `;
    if (!rows[0]) return json({ error: "not_found" }, 404);
    return json({ ok: true, snippet: rows[0] });
  } catch (e) {
    return json({ error: e?.message || "query_failed" }, 500);
  }
}

export async function POST(request) {
  const sql = tryDb();
  if (!sql) return json({ error: "db_unavailable" }, 503);

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const code = String(payload?.code ?? "").slice(0, 50000);
  if (!code.trim()) return json({ error: "missing_code" }, 400);
  const title = String(payload?.title ?? "Untitled snippet").trim().slice(0, 120) || "Untitled snippet";
  const stdin = payload?.stdin == null ? null : String(payload.stdin).slice(0, 10000);
  const language = "python";

  const userId = await currentUserId();
  const token = shareToken();

  try {
    const [row] = await sql`
      insert into playground_snippets (user_id, title, code, stdin, language, share_token, is_public)
      values (${userId}, ${title}, ${code}, ${stdin}, ${language}, ${token}, true)
      returning id, title, code, stdin, language, share_token, is_public, created_at
    `;
    return json({ ok: true, snippet: row }, 201);
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
    await sql`delete from playground_snippets where id = ${id} and user_id = ${userId}`;
    return json({ ok: true, deleted: id });
  } catch (e) {
    return json({ error: e?.message || "delete_failed" }, 500);
  }
}
