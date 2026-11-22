import { NextResponse } from "next/server";

import { assertAdmin } from "../../../../../lib/admin-auth";
import { getAiTool } from "../../../../../lib/ai-tools-catalog";
import { db } from "../../../../../lib/db";
import { PROMPT_INJECTION_GUARD, clampText, redactSensitive, safeAuditMeta } from "../../../../../lib/ai/safety.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORKER_URL = (process.env.TUTOR_WORKER_URL || "https://skillbridge-tutor.skillsbridg-academy.workers.dev")
  .trim()
  .replace(/\/+$/, "");
const MAX_BODY_BYTES = 32 * 1024;
const UPSTREAM_TIMEOUT_MS = 30000;

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

async function safeQuery(label, fn) {
  try {
    return await fn();
  } catch (e) {
    return { __error: label, message: e?.message || "query_failed" };
  }
}

function redactRow(row) {
  return redactSensitive(row);
}

async function logAiRun({ toolId, ok, status, inputLength, recordsIncluded, error }) {
  try {
    const sql = db();
    await sql`
      insert into audit_log (actor_user_id, action, entity_type, entity_id, metadata)
      values (
        ${"admin"},
        ${"admin_ai.run"},
        ${"ai_tool"},
        ${String(toolId || "unknown")},
        ${JSON.stringify(safeAuditMeta({ ok, status, inputLength, recordsIncluded, error: error || null }))}
      )
    `;
  } catch {
    // Audit logging must not block admin AI.
  }
}

async function gatherStudentRecords() {
  const sql = db();
  const [learners, progress, progressEvents, leaderboard, enquiries, courses] = await Promise.all([
    safeQuery("learners", () => sql`select id, name, email, school, stage, notes, created_at, updated_at from learners order by updated_at desc limit 200`),
    safeQuery("course_progress", () => sql`select user_id, course_slug, completed_lessons, total_lessons, percent, updated_at from course_progress order by updated_at desc limit 200`),
    safeQuery("course_progress_events", () => sql`select user_id, course_slug, lesson_id, event_type, created_at from course_progress_events order by created_at desc limit 200`),
    safeQuery("leaderboard_entries", () => sql`select id, name, score, course_slug, updated_at from leaderboard_entries order by score desc limit 100`),
    (async () => {
      try {
        return await sql`select id, school_name, school_location, contact_name, email, phone, learner_count, programme_interest, status, source, assigned_to, admin_note, follow_up_at, last_contacted_at, created_at, updated_at from school_enquiries order by created_at desc limit 100`;
      } catch {
        return safeQuery("school_enquiries", () => sql`select id, school_name, school_location, contact_name, email, phone, learner_count, programme_interest, status, created_at from school_enquiries order by created_at desc limit 100`);
      }
    })(),
    safeQuery("lms_courses", () => sql`select id, title, level, summary, duration, start_date, featured, published, position from lms_courses order by position asc, id asc limit 100`),
  ]);

  const map = (v) => (Array.isArray(v) ? v.map(redactRow) : v);
  return {
    learners: map(learners),
    course_progress: map(progress),
    course_progress_events: map(progressEvents),
    leaderboard_entries: map(leaderboard),
    school_enquiries: map(enquiries),
    lms_courses: map(courses),
  };
}

function buildPrompt(tool, input, records) {
  const recordBlock = JSON.stringify(records).slice(0, 24000);
  return [
    `You are SkillBridge Academy's admin AI assistant.`,
    `Tool: ${tool.name} (${tool.category})`,
    `Description: ${tool.description}`,
    `Return a clear, actionable response in markdown.`,
    `If student records are provided, use them. Do not invent private data.`,
    PROMPT_INJECTION_GUARD,
    `Student records (JSON, read-only, admin-authorized):`,
    recordBlock,
    `Admin request/input:`,
    clampText(input, 8000),
  ].join("\n\n");
}

async function callTutor(prompt) {
  const body = {
    message: prompt,
    history: [],
    studentContext: { name: "Admin", role: "admin" },
    teachingStyle: "clear",
  };
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  const serviceAuth = process.env.TUTOR_SERVICE_AUTHORIZATION?.trim();
  if (serviceAuth) headers.Authorization = serviceAuth;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(`${WORKER_URL}/v1/tutor/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 2000) }; }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 502, data: { error: e?.name === "AbortError" ? "llm_timeout" : "llm_unavailable" } };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, 413);
  }

  let raw = "";
  try {
    raw = await request.text();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, 413);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return json({ error: "invalid_payload" }, 400);
  }

  const toolId = String(payload?.toolId || "").trim();
  const input = clampText(payload?.input, 8000);
  const tool = getAiTool(toolId);
  if (!tool) return json({ error: "unknown_tool" }, 404);
  if (!input) return json({ error: "missing_input" }, 400);

  const records = await gatherStudentRecords();
  const prompt = buildPrompt(tool, input, records);

  const llm = await callTutor(prompt);
  const recordsIncluded = Object.keys(records);
  if (llm.ok) {
    await logAiRun({ toolId: tool.id, ok: true, status: llm.status, inputLength: input.length, recordsIncluded });
    return json({
      ok: true,
      tool,
      result: llm.data?.text ?? llm.data?.response ?? llm.data,
      sources: llm.data?.sources ?? [],
      recordsIncluded,
    });
  }

  const error = llm.data?.error || "llm_unavailable";
  await logAiRun({ toolId: tool.id, ok: false, status: llm.status, inputLength: input.length, recordsIncluded, error });
  // If the tutor worker rejects due to auth/config, return the assembled context
  // and prompt metadata so the admin still gets DB-backed access.
  return json({
    ok: false,
    tool,
    error,
    status: llm.status,
    recordsIncluded,
    records,
    promptPreview: prompt.slice(0, 4000),
    message:
      "AI model call failed (tutor worker auth/config). Student records were collected server-side for this admin request; configure TUTOR_SERVICE_AUTHORIZATION or use a learner-authenticated tutor flow for generative output.",
  }, 200);
}
