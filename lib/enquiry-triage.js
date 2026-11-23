/**
 * Deterministic triage helpers for school enquiries.
 *
 * These are intentionally rule-based so they work even when the AI worker is
 * unavailable, and they never send PII off-site. The admin AI tools can still
 * be used for narrative follow-up drafts.
 */

function norm(value) {
  return String(value || "").trim().toLowerCase();
}

function daysSince(value, now = Date.now()) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((now - time) / (1000 * 60 * 60 * 24));
}

function learnerCount(value) {
  const match = String(value || "").match(/\d+/);
  if (!match) return 0;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : 0;
}

export function triageEnquiry(row, now = Date.now()) {
  const status = norm(row.status);
  const createdDays = daysSince(row.created_at, now) ?? 0;
  const followUpAt = row.follow_up_at ? new Date(row.follow_up_at).getTime() : null;
  const overdue = followUpAt !== null && followUpAt < now && !["closed", "lost", "enrolled"].includes(status);
  const stale = !["closed", "lost", "enrolled"].includes(status) && createdDays > 3;
  const duplicate = Boolean(row.duplicate);
  const learners = learnerCount(row.learner_count);

  let score = 0;
  const reasons = [];
  const tags = [];

  if (status === "new") { score += 30; reasons.push("new enquiry"); tags.push("new"); }
  else if (status === "contacted") { score += 10; }
  else if (status === "scheduled") { score += 5; }
  else if (status === "enrolled") { score -= 20; }
  else if (status === "closed" || status === "lost") { score -= 40; }

  if (overdue) { score += 25; reasons.push("overdue follow-up"); tags.push("overdue"); }
  if (stale) { score += 15; reasons.push("stale (3+ days)"); tags.push("stale"); }
  if (duplicate) { score += 10; reasons.push("duplicate email"); tags.push("duplicate"); }
  if (learners >= 50) { score += 15; reasons.push(`${learners} learners`); tags.push("high-volume"); }
  else if (learners >= 20) { score += 8; reasons.push(`${learners} learners`); }
  else if (learners >= 10) { score += 4; }

  const message = norm(row.message);
  if (message.length >= 200) { score += 5; reasons.push("detailed message"); }
  if (norm(row.programme_interest).includes("robot") || norm(row.programme_interest).includes("ai")) {
    score += 5; tags.push("tech-interest");
  }
  if (createdDays > 14 && !["closed", "lost", "enrolled"].includes(status)) {
    score += 10; reasons.push("aging enquiry");
  }

  score = Math.max(0, Math.min(100, score));

  let priority = "Low";
  if (score >= 70) priority = "Urgent";
  else if (score >= 45) priority = "High";
  else if (score >= 20) priority = "Medium";

  const suggestedStatus =
    status === "new"
      ? (priority === "Urgent" || priority === "High" ? "contacted" : "new")
      : status;

  const suggestedFollowUpDays = priority === "Urgent" ? 1 : priority === "High" ? 3 : priority === "Medium" ? 7 : 14;

  return {
    score,
    priority,
    reasons: reasons.length ? reasons : ["no urgent signals"],
    tags,
    suggestedStatus,
    suggestedFollowUpDays,
    overdue,
    stale,
    duplicate,
  };
}

export function summarizeEnquiryQueue(rows, now = Date.now()) {
  const enriched = (rows || []).map((row) => ({ ...row, triage: triageEnquiry(row, now) }));
  const counts = { Urgent: 0, High: 0, Medium: 0, Low: 0 };
  for (const row of enriched) counts[row.triage.priority] += 1;

  const urgent = enriched
    .filter((row) => row.triage.priority === "Urgent")
    .sort((a, b) => b.triage.score - a.triage.score)
    .slice(0, 5);

  const lines = [];
  lines.push(`Queue: ${enriched.length} enquiries · ${counts.Urgent} urgent · ${counts.High} high · ${counts.Medium} medium · ${counts.Low} low.`);
  if (urgent.length) {
    lines.push("Top urgent:");
    for (const row of urgent) {
      lines.push(`- #${row.id} ${row.school_name} (${row.contact_name}) — ${row.triage.reasons.join(", ")}.`);
    }
  } else {
    lines.push("No urgent enquiries right now.");
  }
  lines.push("Recommended actions: contact urgent items first, schedule follow-ups, and close duplicates.");
  return { counts, urgent, text: lines.join("\n") };
}
