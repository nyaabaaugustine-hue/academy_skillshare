import { NextResponse } from "next/server";

import { getAwardByToken, respondAwardConsent } from "@/lib/awards";
import { sendSlackNotification } from "@/lib/notifications/slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const award = await getAwardByToken(token);
  if (!award) return json({ error: "not_found" }, 404);
  return json({
    ok: true,
    award: {
      learner: award.learner_alias || award.learner_name,
      title: award.award_title,
      milestone: award.milestone,
      consentVerified: Boolean(award.consent_verified),
      respondedAt: award.consent_responded_at || null,
      publicShare: Boolean(award.public_share),
    },
  });
}

export async function POST(request) {
  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }
  const token = String(payload?.token || "").trim();
  const decision = payload?.decision === "approve" ? "approve" : payload?.decision === "decline" ? "decline" : "";
  if (!token || !decision) return json({ error: "missing_token_or_decision" }, 400);

  try {
    const award = await respondAwardConsent(token, decision, payload?.note);
    if (!award) return json({ error: "not_found" }, 404);
    await sendSlackNotification({
      event: "award_consent",
      title: `Guardian consent ${decision === "approve" ? "approved" : "declined"}`,
      details: [`Award: ${award.award_title}`, `Learner: ${award.learner_alias || award.learner_name}`],
      adminPath: "/admin/awards",
    }).catch(() => {});
    return json({ ok: true, decision, award: { id: award.id, consentVerified: award.consent_verified, publicShare: award.public_share } });
  } catch (e) {
    return json({ error: e?.message || "consent_failed" }, 500);
  }
}
