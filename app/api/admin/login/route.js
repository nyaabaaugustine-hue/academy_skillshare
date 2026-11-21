import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createSessionToken,
  credentialsMatch,
  normaliseAdminEmail,
} from "../../../../lib/admin-auth";
import { clientKey, rateLimit } from "../../../../lib/server/rate-limit";

/** Only allow redirects back into the admin area, never an external URL. */
function safeNext(value) {
  const next = String(value ?? "").trim();
  if (next === "/admin" || /^\/admin\/[a-z0-9/_-]*$/i.test(next)) return next;
  return "/admin";
}

export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));

  const limit = rateLimit(`admin-login:${clientKey(request)}`, {
    limit: 10,
    windowMs: 5 * 60_000,
  });

  if (!limit.ok) {
    return NextResponse.redirect(
      new URL("/admin/login?error=rate", request.url),
      303,
    );
  }

  if (!credentialsMatch(email, password)) {
    const target = new URL("/admin/login?error=1", request.url);
    if (next !== "/admin") target.searchParams.set("next", next);
    return NextResponse.redirect(target, 303);
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(
    ADMIN_COOKIE,
    createSessionToken(Date.now(), normaliseAdminEmail(email)),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
    },
  );
  return response;
}
