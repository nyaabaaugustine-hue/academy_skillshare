import { NextResponse } from "next/server";

import { normaliseAdminEmail } from "../../../../lib/admin-auth";
import { clientKey, rateLimit } from "../../../../lib/server/rate-limit";
import { verifyTurnstile } from "../../../../lib/cloudflare/turnstile";
import { sendSlackNotification } from "../../../../lib/notifications/slack";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function notifyAdminResetRequest() {
  await sendSlackNotification({
    text:
      ":key: SkillBridge admin password reset assistance requested. " +
      "If this was expected, update ADMIN_PASSWORD in the deployment environment. " +
      `Time: ${new Date().toISOString()}`,
  });
}

export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();

  const limit = rateLimit(`admin-forgot-password:${clientKey(request)}`, {
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.redirect(
      new URL("/admin/forgot-password?error=rate", request.url),
      303,
    );
  }

  const turnstile = await verifyTurnstile(request, form.get("cf-turnstile-response"));
  if (!turnstile.ok) {
    return NextResponse.redirect(
      new URL("/admin/forgot-password?error=turnstile", request.url),
      303,
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.redirect(
      new URL("/admin/forgot-password?error=invalid", request.url),
      303,
    );
  }

  const adminEmail = normaliseAdminEmail(process.env.ADMIN_EMAIL);
  if (adminEmail && email === adminEmail) {
    // Fire and forget; do not reveal match/no-match to caller.
    await notifyAdminResetRequest();
  }

  return NextResponse.redirect(
    new URL("/admin/login?reset=requested", request.url),
    303,
  );
}
