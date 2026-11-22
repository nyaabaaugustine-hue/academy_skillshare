import { NextResponse } from "next/server";

import { db } from "../../../lib/db";
import { verifyTurnstile } from "../../../lib/cloudflare/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (v, max = 500) => String(v ?? "").trim().slice(0, max);

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const turnstile = await verifyTurnstile(request, body?.turnstileToken);
  if (!turnstile.ok) return NextResponse.json({ error: turnstile.error || "Verification failed." }, { status: 400 });

  const projectId = Number(body?.projectId);
  const projectTitle = text(body?.projectTitle, 180);
  const reason = text(body?.reason, 80);
  const details = text(body?.details, 1200);
  const reporterEmail = text(body?.reporterEmail, 200).toLowerCase();

  if (!reason || !details) return NextResponse.json({ error: "Please include a reason and details." }, { status: 400 });

  try {
    await db()`
      insert into project_reports (project_id, project_title, reason, details, reporter_email, status)
      values (${Number.isInteger(projectId) && projectId > 0 ? projectId : null}, ${projectTitle}, ${reason}, ${details}, ${reporterEmail}, ${"new"})
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("project report failed", e);
    return NextResponse.json({ error: "Could not submit report right now." }, { status: 500 });
  }
}
