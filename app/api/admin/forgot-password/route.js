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
    event: "admin_password_reset_requested",
    title: "Admin password reset assistance requested",
    details: ["Action: verify request and rotate ADMIN_PASSWORD in deployment env if expected"],
    adminPath: "/admin",
    severity: "warning",
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

  const turnstile = await verifyTurnstile(request, form.get("cf-turnstile-response"), { action: "admin-forgot-password" });
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
