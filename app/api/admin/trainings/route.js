import { NextResponse } from "next/server";

import { assertAdmin } from "../../../../lib/admin-auth";
import { db } from "../../../../lib/db";

const text = (form, key, max = 400) =>
  String(form.get(key) ?? "").trim().slice(0, max);

const back = (request, query) =>
  NextResponse.redirect(new URL(`/admin/trainings${query}`, request.url), 303);

export async function POST(request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const form = await request.formData();
  const intent = text(form, "intent", 20);
  const id = Number(form.get("id") ?? 0);

  try {
    if (intent === "delete") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      await db()`delete from upcoming_trainings where id = ${id}`;
      return back(request, "?saved=deleted");
    }

    const title = text(form, "title", 180);
    if (title === "") return back(request, "?error=required");

    const type = text(form, "type", 30).toUpperCase() === "BOOTCAMP" ? "BOOTCAMP" : "TRAINING";
    const dateLabel = text(form, "date_label", 80);
    const duration = text(form, "duration", 80);
    const format = text(form, "format", 120);
    const image = text(form, "image", 1200);
    const description = text(form, "description", 1200);
    const position = Number(form.get("position") ?? 0) || 0;
    const published = form.get("published") === "on";

    if (intent === "update") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      await db()`
        update upcoming_trainings
        set type = ${type}, title = ${title}, date_label = ${dateLabel}, duration = ${duration},
            format = ${format}, image = ${image}, description = ${description},
            position = ${position}, published = ${published}
        where id = ${id}
      `;
      return back(request, "?saved=updated");
    }

    await db()`
      insert into upcoming_trainings (type, title, date_label, duration, format, image, description, position, published)
      values (${type}, ${title}, ${dateLabel}, ${duration}, ${format}, ${image}, ${description}, ${position}, ${published})
    `;
    return back(request, "?saved=created");
  } catch {
    return back(request, "?error=save");
  }
}
