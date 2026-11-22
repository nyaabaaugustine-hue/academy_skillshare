import { cloudflareConfig } from "./config.js";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Server-side Turnstile verification.
 *
 * Disabled (returns ok) when no secret is configured, so the app keeps working
 * before Cloudflare keys are added. When configured, a missing/invalid token is
 * rejected.
 */
export async function verifyTurnstile(request, token) {
  const { turnstile } = cloudflareConfig();
  if (!turnstile.secretKey) return { ok: true, skipped: true };

  const value = String(token || "").trim();
  if (!value) return { ok: false, error: "turnstile_missing" };

  const form = new FormData();
  form.set("secret", turnstile.secretKey);
  form.set("response", value);
  const ip = request?.headers?.get?.("cf-connecting-ip");
  if (ip) form.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body: form, cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success !== true) {
      return { ok: false, error: "turnstile_failed" };
    }
    return { ok: true, skipped: false };
  } catch {
    return { ok: false, error: "turnstile_unavailable" };
  }
}
