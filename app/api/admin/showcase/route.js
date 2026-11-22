import { NextResponse } from "next/server";

import { assertAdmin } from "../../../../lib/admin-auth";
import { db } from "../../../../lib/db";
import { publicLearnerName } from "../../../../lib/safety";

const text = (form, key, max = 400) => String(form.get(key) ?? "").trim().slice(0, max);
const back = (request, query) => NextResponse.redirect(new URL(`/admin/showcase${query}`, request.url), 303);

export async function POST(request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const form = await request.formData();
  const intent = text(form, "intent", 40);
  const id = Number(form.get("id") ?? 0);

  try {
    if (intent === "submission_status") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      const status = text(form, "status", 30) || "reviewed";
      const note = text(form, "admin_note", 1000);
      await db()`update project_submissions set status = ${status}, admin_note = ${note} where id = ${id}`;
      return back(request, "?saved=submission");
    }

    if (intent === "publish_submission") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      const rows = await db()`select * from project_submissions where id = ${id} limit 1`;
      const s = rows[0];
      if (!s) return back(request, "?error=missing");
      await db()`
        insert into project_showcase (title, description, learner_name, skill, image, project_url, position, published)
        values (${s.project_title}, ${s.description}, ${publicLearnerName(s.learner_alias)}, ${s.skill}, ${s.image_url}, ${s.project_url}, ${0}, ${true})
      `;
      await db()`update project_submissions set status = ${"published"}, admin_note = ${text(form, "admin_note", 1000)} where id = ${id}`;
      return back(request, "?saved=published");
    }

    if (intent === "report_status") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      const status = text(form, "status", 30) || "reviewed";
      await db()`update project_reports set status = ${status} where id = ${id}`;
      return back(request, "?saved=report");
    }

    if (intent === "delete_report") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      await db()`delete from project_reports where id = ${id}`;
      return back(request, "?saved=deleted");
    }

    if (intent === "delete_submission") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      await db()`delete from project_submissions where id = ${id}`;
      return back(request, "?saved=deleted");
    }

    if (intent === "delete_showcase") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      await db()`delete from project_showcase where id = ${id}`;
      return back(request, "?saved=deleted");
    }

    const title = text(form, "title", 180);
    if (!title) return back(request, "?error=required");
    const description = text(form, "description", 2000);
    const learnerName = text(form, "learner_name", 120);
    const skill = text(form, "skill", 80);
    const image = text(form, "image", 1200);
    const projectUrl = text(form, "project_url", 1200);
    const position = Number(form.get("position") ?? 0) || 0;
    const published = form.get("published") === "on";

    if (intent === "update_showcase") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      await db()`
        update project_showcase set title=${title}, description=${description}, learner_name=${learnerName}, skill=${skill},
        image=${image}, project_url=${projectUrl}, position=${position}, published=${published} where id=${id}
      `;
      return back(request, "?saved=updated");
    }

    if (intent === "create_showcase") {
      await db()`
        insert into project_showcase (title, description, learner_name, skill, image, project_url, position, published)
        values (${title}, ${description}, ${learnerName}, ${skill}, ${image}, ${projectUrl}, ${position}, ${published})
      `;
      return back(request, "?saved=created");
    }

    return back(request, "?error=unknown");
  } catch (e) {
    console.error("admin showcase error", e);
    return back(request, "?error=save");
  }
}
