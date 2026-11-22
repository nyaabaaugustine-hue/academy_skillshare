import { NextResponse } from "next/server";

import { db } from "../../../lib/db";
import { verifyTurnstile } from "../../../lib/cloudflare/turnstile";
import { sendSlackNotification } from "../../../lib/notifications/slack";
import { assertNoPublicPii, publicLearnerName } from "../../../lib/safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const text = (v, max = 300) => String(v ?? "").trim().slice(0, max);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const turnstile = await verifyTurnstile(request, body?.turnstileToken);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.error || "Verification failed." }, { status: 400 });
  }

  const learnerAlias = publicLearnerName(body.learnerAlias);
  const ageGroup = text(body.ageGroup, 40);
  const guardianName = text(body.guardianName, 120);
  const guardianEmail = text(body.guardianEmail, 200).toLower();
  const projectTitle = text(body.projectTitle, 160);
  const skill = text(body.skill, 80);
  const description = text(body.description, 2000);
  const projectUrl = text(body.projectUrl, 1200);
  const imageUrl = text(body.imageUrl, 1200);
  const consentPublish = body.consentPublish === true;
  const consentGuardian = body.consentGuardian === true;

  if (!learnerAlias || !projectTitle || !guardianName || !isEmail(guardianEmail)) {
    return NextResponse.json({ error: "Please complete the required fields with a valid guardian email." }, { status: 400 });
  }
  if (!consentGuardian || !consentPublish) {
    return NextResponse.json({ error: "Guardian consent and publish permission are required." }, { status: 400 });
  }
  const piiError = assertNoPublicPii({
    "Learner alias": learnerAlias,
    "Project title": projectTitle,
    "Description": description,
  });
  if (piiError) {
    return NextResponse.json({ error: piiError }, { status: 400 });
  }

  try {
    await db()`
      insert into project_submissions
        (learner_alias, age_group, guardian_name, guardian_email, project_title, skill, description, project_url, image_url, consent_publish, consent_guardian, status)
      values
        (${learnerAlias}, ${ageGroup}, ${guardianName}, ${guardianEmail}, ${projectTitle}, ${skill}, ${description}, ${projectUrl}, ${imageUrl}, ${consentPublish}, ${consentGuardian}, ${"new"})
    `;
    await sendSlackNotification({
      text: `New project submission: "${projectTitle}" (${skill || "skill not specified"})`,
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("project submission failed", e);
    return NextResponse.json({ error: "Could not submit project right now. Please try again." }, { status: 500 });
  }
}
