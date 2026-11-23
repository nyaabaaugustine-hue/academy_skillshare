import { tryDb } from "./db";
import { triageEnquiry } from "./enquiry-triage";
import { emailLayout, textValue } from "./email";

export async function buildAdminDigest() {
  const sql = tryDb();
  const now = Date.now();

  let enquiries = [];
  let awards = [];
  let leaderboard = [];

  if (sql) {
    try { enquiries = await sql`select id, school_name, contact_name, email, status, learner_count, created_at, follow_up_at from school_enquiries order by created_at desc limit 100`; } catch { enquiries = []; }
    try { awards = await sql`select id, learner_alias, award_title, status, consent_verified, public_share, guardian_email, issued_at from learner_awards order by issued_at desc limit 100`; } catch { awards = []; }
    try { leaderboard = await sql`select id, name, score, course_slug, updated_at from leaderboard_entries order by score asc limit 100`; } catch { leaderboard = []; }
  }

  const triaged = enquiries.map((row) => ({ ...row, triage: triageEnquiry(row, now) }));
  const urgent = triaged.filter((r) => r.triage.priority === "Urgent");
  const overdue = triaged.filter((r) => r.triage.overdue);
  const atRisk = leaderboard.filter((r) => Number(r.score || 0) < 40);

  const awaitingConsent = awards.filter((a) => !a.consent_verified && a.guardian_email);

  const subject = `SkillBridge admin digest — ${urgent.length} urgent, ${overdue.length} overdue, ${atRisk.length} at-risk`;

  const textLines = [
    "SkillBridge Academy — admin digest",
    "",
    `Enquiries: ${enquiries.length} total, ${urgent.length} urgent, ${overdue.length} overdue, ${triaged.filter((r) => r.triage.priority === "High").length} high.`,
    urgent.length ? "Urgent enquiries:" : "No urgent enquiries.",
    ...urgent.slice(0, 8).map((r) => `- #${r.id} ${r.school_name} (${r.contact_name}) — ${r.triage.reasons.join(", ")}`),
    "",
    `Awards: ${awards.length} total, ${awaitingConsent.length} awaiting guardian consent.`,
    "",
    `Learners: ${leaderboard.length} tracked, ${atRisk.length} with score below 40 (at-risk heuristic).`,
    "",
    "Open dashboard: https://www.skillbridgeacademy.tech/admin",
  ];

  const html = emailLayout({
    title: "Admin digest",
    intro: "A quick summary of what needs attention in SkillBridge Academy.",
    rows: [
      { label: "Enquiries", value: `${enquiries.length} total` },
      { label: "Urgent", value: String(urgent.length) },
      { label: "Overdue follow-ups", value: String(overdue.length) },
      { label: "Awards awaiting consent", value: String(awaitingConsent.length) },
      { label: "At-risk learners", value: String(atRisk.length) },
    ],
    body: `<p style="margin:0 0 8px;font-weight:700">Urgent enquiries</p>
      ${urgent.length ? `<ul style="margin:0 0 12px;padding-left:20px">${urgent.slice(0, 8).map((r) => `<li>#${r.id} ${textValue(r.school_name, 80)} — ${textValue(r.triage.reasons.join(", "), 120)}</li>`).join("")}</ul>` : "<p style=\"margin:0 0 12px\">None right now.</p>"}
      <p style="margin:0 0 8px;font-weight:700">Awards awaiting guardian consent</p>
      ${awaitingConsent.length ? `<ul style="margin:0 0 12px;padding-left:20px">${awaitingConsent.slice(0, 8).map((a) => `<li>${textValue(a.learner_alias, 60)} — ${textValue(a.award_title, 80)}</li>`).join("")}</ul>` : "<p style=\"margin:0 0 12px\">None.</p>"}`,
    ctaLabel: "Open admin dashboard",
    ctaUrl: "https://www.skillbridgeacademy.tech/admin",
    footer: "Admin digest from SkillBridge Academy.",
  });

  return { subject, text: textLines.join("\n"), html, counts: { enquiries: enquiries.length, urgent: urgent.length, overdue: overdue.length, awards: awards.length, awaitingConsent: awaitingConsent.length, atRisk: atRisk.length } };
}
