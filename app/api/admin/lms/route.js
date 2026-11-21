import { NextResponse } from "next/server";

import { assertAdmin } from "../../../../lib/admin-auth";
import { db } from "../../../../lib/db";

const text = (form, key, max = 400) =>
  String(form.get(key) ?? "").trim().slice(0, max);

const dateValue = (form, key) => {
  const value = text(form, key, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
};

const back = (request, query) =>
  NextResponse.redirect(new URL(`/admin/lms${query}`, request.url), 303);

function schemaError(error) {
  return error?.code === "42703" || error?.code === "42P01";
}

export async function POST(request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const form = await request.formData();
  const intent = text(form, "intent", 20);
  const id = Number(form.get("id") ?? 0);

  try {
    if (intent === "delete") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      await db()`delete from lms_courses where id = ${id}`;
      return back(request, "?saved=deleted");
    }

    if (intent === "publish" || intent === "unpublish") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      await db()`
        update lms_courses set published = ${intent === "publish"} where id = ${id}
      `;
      return back(request, "?saved=status");
    }

    if (intent === "feature" || intent === "unfeature") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      if (intent === "feature") {
        await db()`
          update lms_courses set featured = false
          where featured = true and id <> ${id}
        `;
        await db()`
          update lms_courses set featured = true, published = true where id = ${id}
        `;
      } else {
        await db()`update lms_courses set featured = false where id = ${id}`;
      }
      return back(request, "?saved=spotlight");
    }

    const title = text(form, "title", 180);
    if (title === "") return back(request, "?error=required");

    const level = text(form, "level", 80);
    const summary = text(form, "summary", 600);
    const topics = text(form, "topics", 600);
    const duration = text(form, "duration", 80);
    const link = text(form, "link", 1200);
    const startDate = dateValue(form, "start_date");
    const image = text(form, "image", 1200);
    const outcomes = text(form, "outcomes", 900);
    const format = text(form, "format", 120);
    const ctaLabel = text(form, "cta_label", 80);
    const position = Number(form.get("position") ?? 0) || 0;
    const published = form.get("published") === "on";
    const featured = form.get("featured") === "on";

    if (intent === "update") {
      if (!Number.isInteger(id) || id <= 0) return back(request, "?error=missing");
      if (featured) {
        await db()`
          update lms_courses set featured = false
          where featured = true and id <> ${id}
        `;
      }
      await db()`
        update lms_courses
        set title = ${title}, level = ${level}, summary = ${summary},
            topics = ${topics}, duration = ${duration}, link = ${link},
            start_date = ${startDate}, featured = ${featured},
            image = ${image}, outcomes = ${outcomes}, format = ${format},
            cta_label = ${ctaLabel},
            position = ${position}, published = ${published}
        where id = ${id}
      `;
      return back(request, "?saved=updated");
    }

    if (featured) {
      await db()`update lms_courses set featured = false where featured = true`;
    }

    await db()`
      insert into lms_courses
        (title, level, summary, topics, duration, link, start_date, featured,
         image, outcomes, format, cta_label, position, published)
      values
        (${title}, ${level}, ${summary}, ${topics}, ${duration}, ${link},
         ${startDate}, ${featured}, ${image}, ${outcomes}, ${format},
         ${ctaLabel}, ${position}, ${published})
    `;
    return back(request, "?saved=created");
  } catch (error) {
    if (schemaError(error)) return back(request, "?error=schema");
    return back(request, "?error=save");
  }
}
