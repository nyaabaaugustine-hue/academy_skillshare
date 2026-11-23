import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { tryDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODES = new Set(["explain", "debug", "quiz", "plan", "review", "project", "git", "functional", "stacktrace", "security", "architecture", "testing", "refactor"]);
const LEVELS = new Set(["standard", "simple", "advanced"]);
const LANGS = new Set(["en"]);

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
    const rows = await sql`select tutor_mode, reading_level, language, reminders from account_preferences where user_id = ${userId} limit 1`;
    const prefs = rows[0] || { tutor_mode: "explain", reading_level: "standard", language: "en", reminders: false };
    return json({ ok: true, preferences: prefs });
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

  const tutorMode = MODES.has(payload?.tutor_mode) ? payload.tutor_mode : "explain";
  const readingLevel = LEVELS.has(payload?.reading_level) ? payload.reading_level : "standard";
  const language = LANGS.has(payload?.language) ? payload.language : "en";
  const reminders = Boolean(payload?.reminders);

  try {
    await sql`
      insert into account_preferences (user_id, tutor_mode, reading_level, language, reminders, updated_at)
      values (${userId}, ${tutorMode}, ${readingLevel}, ${language}, ${reminders}, now())
      on conflict (user_id) do update set
        tutor_mode = excluded.tutor_mode,
        reading_level = excluded.reading_level,
        language = excluded.language,
        reminders = excluded.reminders,
        updated_at = now()
    `;
    return json({ ok: true, preferences: { tutor_mode: tutorMode, reading_level: readingLevel, language, reminders } });
  } catch (e) {
    return json({ error: e?.message || "save_failed" }, 500);
  }
}
