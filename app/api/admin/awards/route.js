import { NextResponse } from "next/server";

import { assertAdmin } from "../../../../lib/admin-auth";
import { db } from "../../../../lib/db";
import { createAward, createCertificateAwardsFromLeaderboard, requestAwardConsent, getAwardByToken } from "../../../../lib/awards";
import { listLeaderboard } from "../../../../lib/server/leaderboard";
import { sendSlackNotification } from "../../../../lib/notifications/slack";
import { sendAwardConsentRequest } from "../../../../lib/email";
import { getSiteUrl } from "../../../../lib/site-url";

const text = (form, key, max = 400) => String(form.get(key) ?? "").trim().slice(0, max);
const back = (request, query) => NextResponse.redirect(new URL(`/admin/awards${query}`, request.url), 303);

export async function POST(request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;
  const form = await request.formData();
  const intent = text(form, "intent", 40);

  try {
    if (intent === "generate_from_leaderboard") {
      const entries = await listLeaderboard(50).catch(() => []);
      const created = await createCertificateAwardsFromLeaderboard(entries);
      if (created > 0) {
        await sendSlackNotification({
          event: "awards_generated",
          title: "Leaderboard certificates generated",
          details: [`Created: ${created} certificate(s)`, "Source: admin awards dashboard"],
          adminPath: "/admin/awards",
        }).catch(() => {});
      }
      return back(request, `?saved=generated&count=${created}`);
    }

    if (intent === "request_consent") {
      const id = Number(form.get("id") ?? 0);
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      const award = await requestAwardConsent(id);
      if (!award) return back(request, "?error=missing");
      const siteUrl = getSiteUrl().replace(/\/$/, "");
      const consentUrl = `${siteUrl}/certificates/${award.share_token}/consent`;
      const declineUrl = `${siteUrl}/certificates/${award.share_token}/consent`;
      const emailResult = await sendAwardConsentRequest({ award, consentUrl, declineUrl });
      await sendSlackNotification({
        event: "award_consent_requested",
        title: "Guardian consent requested",
        details: [`Award: ${award.award_title}`, `Guardian: ${award.guardian_email}`, `Email: ${emailResult.ok ? "sent" : emailResult.error || "skipped"}`],
        adminPath: "/admin/awards",
      }).catch(() => {});
      return back(request, emailResult.ok ? "?saved=consent_requested" : "?saved=consent_requested&email=skipped");
    }

    if (intent === "update_status") {
      const id = Number(form.get("id") ?? 0);
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      const status = text(form, "status", 40) || "awarded";
      const consentVerified = form.get("consent_verified") === "on";
      const publicShare = form.get("public_share") === "on";
      await db()`update learner_awards set status=${status}, consent_verified=${consentVerified}, public_share=${publicShare} where id=${id}`;
      return back(request, "?saved=updated");
    }

    if (intent === "delete") {
      const id = Number(form.get("id") ?? 0);
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      await db()`delete from learner_awards where id=${id}`;
      return back(request, "?saved=deleted");
    }

    if (intent === "create") {
      const learnerName = text(form, "learner_name", 80);
      const awardTitle = text(form, "award_title", 160);
      if (!learnerName || !awardTitle) return back(request, "?error=required");
      const awardType = text(form, "award_type", 40) || "certificate";
      await createAward({
        learnerName,
        learnerAlias: learnerName,
        guardianName: text(form, "guardian_name", 120),
        guardianEmail: text(form, "guardian_email", 200),
        awardType,
        awardTitle,
        awardDetail: text(form, "award_detail", 500),
        milestone: text(form, "milestone", 120),
        prizeItem: text(form, "prize_item", 120),
        status: text(form, "status", 40) || "awarded",
        consentVerified: form.get("consent_verified") === "on",
        publicShare: form.get("public_share") === "on",
      });
      await sendSlackNotification({
        event: "award_created",
        title: "New award/certificate recorded",
        details: [`Type: ${awardType}`, `Title: ${awardTitle}`],
        adminPath: "/admin/awards",
      }).catch(() => {});
      return back(request, "?saved=created");
    }

    return back(request, "?error=unknown");
  } catch (e) {
    console.error("admin awards error", e);
    return back(request, "?error=save");
  }
}
