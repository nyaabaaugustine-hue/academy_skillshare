import crypto from "node:crypto";

import { tryDb } from "./db";
import { publicLearnerName } from "./safety";

const shareToken = () => crypto.randomBytes(16).toString("hex");

export function awardShareToken() {
  return shareToken();
}

export async function listAwards(limit = 100) {
  const sql = tryDb();
  if (!sql) return [];
  try {
    const rows = await sql`
      select id, learner_name, learner_alias, guardian_name, guardian_email, award_type, award_title,
             award_detail, milestone, prize_item, status, consent_verified, public_share, share_token, issued_at, created_at
      from learner_awards
      order by issued_at desc, id desc
      limit ${limit}
    `;
    return rows;
  } catch {
    return [];
  }
}

export async function getAwardByToken(token) {
  const sql = tryDb();
  if (!sql) return null;
  const t = String(token || "").trim();
  if (!t) return null;
  try {
    const rows = await sql`
      select id, learner_name, learner_alias, award_type, award_title, award_detail, milestone, prize_item, status, public_share, share_token, issued_at
      from learner_awards
      where share_token = ${t}
      limit 1
    `;
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function createAward(input) {
  const sql = tryDb();
  if (!sql) throw new Error("Database unavailable");
  const learnerName = publicLearnerName(input.learnerName || input.learnerAlias);
  const learnerAlias = publicLearnerName(input.learnerAlias || input.learnerName);
  const token = shareToken();
  const rows = await sql`
    insert into learner_awards
      (learner_name, learner_alias, guardian_name, guardian_email, award_type, award_title, award_detail, milestone, prize_item, status, consent_verified, public_share, share_token, issued_at)
    values
      (${learnerName}, ${learnerAlias}, ${String(input.guardianName || "").slice(0, 120)}, ${String(input.guardianEmail || "").slice(0, 200).toLowerCase()},
       ${String(input.awardType || "certificate").slice(0, 40)}, ${String(input.awardTitle || "SkillBridge Award").slice(0, 160)},
       ${String(input.awardDetail || "").slice(0, 500)}, ${String(input.milestone || "").slice(0, 120)}, ${String(input.prizeItem || "").slice(0, 120)},
       ${String(input.status || "awarded").slice(0, 40)}, ${Boolean(input.consentVerified)}, ${Boolean(input.publicShare)}, ${token}, ${input.issuedAt ? new Date(input.issuedAt) : new Date()})
    returning id, share_token
  `;
  return rows[0];
}

export async function createCertificateAwardsFromLeaderboard(entries = []) {
  const sql = tryDb();
  if (!sql) throw new Error("Database unavailable");
  let created = 0;
  for (const entry of entries) {
    const name = publicLearnerName(entry.name);
    const milestones = [];
    if (Number(entry.stepsCompleted) >= 1) milestones.push({ key: "first-step", title: "First Step Certificate", detail: "Completed the first learning step on SkillBridge." });
    if (Number(entry.stepsCompleted) >= 6) milestones.push({ key: "consistency", title: "Consistency Builder Certificate", detail: "Completed 6 learning steps and kept building momentum." });
    if (Number(entry.stepsCompleted) >= 18 && Number(entry.average) >= 70) milestones.push({ key: "champion", title: "SkillBridge Champion Certificate", detail: "Completed 18 steps with strong average performance." });
    if (Number(entry.rank) > 0 && Number(entry.rank) <= 10) milestones.push({ key: "top-10", title: "Top 10 Learner Certificate", detail: "Reached the top 10 on the SkillBridge leaderboard." });

    for (const m of milestones) {
      const exists = await sql`
        select id from learner_awards
        where learner_alias = ${name} and milestone = ${m.key} and award_type = 'certificate'
        limit 1
      `;
      if (exists[0]) continue;
      await createAward({
        learnerName: name,
        learnerAlias: name,
        awardType: "certificate",
        awardTitle: m.title,
        awardDetail: m.detail,
        milestone: m.key,
        status: "awarded",
        consentVerified: false,
        publicShare: true,
      });
      created += 1;
    }
  }
  return created;
}
