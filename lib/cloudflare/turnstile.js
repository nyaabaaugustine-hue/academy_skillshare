import { cloudflareConfig } from "./config.js";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function expectedHostnamesFromEnv() {
  const raw = process.env.TURNSTILE_HOSTNAMES || process.env.CLOUDFLARE_TURNSTILE_HOSTNAMES || "";
  return new Set(
    raw
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Server-side Turnstile verification.
 *
 * Optional when no secret is configured (keeps local/dev flows working).
 * When configured, enforces canonical siteverify checks: token present,
 * success===true, optional expected action, and optional hostname allowlist.
 */
export async function verifyTurnstile(request, token, opts = {}) {
  const { turnstile } = cloudflareConfig();
  if (!turnstile.secretKey) return { ok: true, skipped: true };

  const value = typeof token === "string" ? token.trim() : String(token || "").trim();
  if (!value) return { ok: false, error: "turnstile_missing" };
  if (value.length > 2048) return { ok: false, error: "turnstile_invalid" };

  const expectedAction = typeof opts.action === "string" && opts.action.trim() ? opts.action.trim() : "";
  const expectedHostnames =
    opts.expectedHostnames instanceof Set
      ? opts.expectedHostnames
      : Array.isArray(opts.expectedHostnames)
        ? new Set(opts.expectedHostnames.map((h) => String(h).trim().toLowerCase()).filter(Boolean))
        : expectedHostnamesFromEnv();

  const body = new URLSearchParams();
  body.set("secret", turnstile.secretKey);
  body.set("response", value);
  const ip = request?.headers?.get?.("cf-connecting-ip") || request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success !== true) {
      return { ok: false, error: "turnstile_failed", details: data?.["error-codes"] };
    }
    if (expectedAction && data?.action !== expectedAction) {
      return { ok: false, error: "turnstile_action_mismatch" };
    }
    if (expectedHostnames.size > 0) {
      const hostname = String(data?.hostname || "").toLowerCase();
      if (!expectedHostnames.has(hostname)) {
        return { ok: false, error: "turnstile_hostname_mismatch" };
      }
    }
    return { ok: true, skipped: false, hostname: data?.hostname, action: data?.action };
  } catch {
    return { ok: false, error: "turnstile_unavailable" };
  }
}
