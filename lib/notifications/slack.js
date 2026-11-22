import { getSiteUrl } from "../site-url.js";

const DEFAULT_TIMEOUT_MS = 5000;
const DEDUPE_WINDOW_MS = 5 * 60_000;
const MAX_EVENTS_PER_WINDOW = 20;
const RATE_WINDOW_MS = 60_000;

const recent = new Map(); // key -> timestamp
const rate = []; // timestamps

function webhookUrl() {
  const value = process.env.SLACK_WEBHOOK_URL;
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

function prune(now) {
  for (const [key, ts] of recent) {
    if (now - ts > DEDUPE_WINDOW_MS) recent.delete(key);
  }
  while (rate.length > 0 && now - rate[0] > RATE_WINDOW_MS) rate.shift();
}

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 3000);
}

function buildMessage(input) {
  if (typeof input === "string") return normalizeText(input);
  if (input?.text) return normalizeText(input.text);

  const event = normalizeText(input?.event || "Notification");
  const title = normalizeText(input?.title || "SkillBridge update");
  const details = Array.isArray(input?.details) ? input.details.map(normalizeText).filter(Boolean) : [];
  const adminPath = normalizeText(input?.adminPath || "");
  const adminUrl = adminPath ? `${getSiteUrl()}${adminPath.startsWith("/") ? adminPath : `/${adminPath}`}` : "";
  const severity = normalizeText(input?.severity || "info").toLowerCase();
  const icon = severity === "critical" ? ":rotating_light:" : severity === "warning" ? ":warning:" : ":bell:";

  const lines = [`${icon} *${title}*`, `Event: ${event}`];
  for (const detail of details.slice(0, 6)) lines.push(`• ${detail}`);
  if (adminUrl) lines.push(`Admin: ${adminUrl}`);
  return normalizeText(lines.join("\n"));
}

function dedupeKey(input, message) {
  const explicit = normalizeText(input?.dedupeKey || "");
  if (explicit) return explicit;
  return normalizeText(`${input?.event || "text"}|${message}`).slice(0, 500);
}

function logDelivery(meta) {
  const payload = { scope: "slack_notification", ...meta, at: new Date().toISOString() };
  if (meta.ok || meta.skipped) console.info("[slack]", payload);
  else console.warn("[slack]", payload);
}

/**
 * Send a minimal Slack notification. Server-only. Never include secrets, tokens,
 * full student records, or unnecessary PII.
 *
 * Accepts either a string/`{text}` or a structured event:
 * { event, title, details: [], adminPath, severity, dedupeKey, timeoutMs }
 */
export async function sendSlackNotification(input = {}) {
  const url = webhookUrl();
  const message = buildMessage(input);
  const now = Date.now();
  prune(now);

  if (!url) {
    const result = { ok: false, skipped: true, reason: "not_configured", event: input?.event || null };
    logDelivery(result);
    return result;
  }
  if (!message) {
    const result = { ok: false, skipped: true, reason: "empty_text", event: input?.event || null };
    logDelivery(result);
    return result;
  }

  const key = dedupeKey(input, message);
  const last = recent.get(key);
  if (last && now - last < DEDUPE_WINDOW_MS) {
    const result = { ok: false, skipped: true, reason: "deduped", event: input?.event || null };
    logDelivery(result);
    return result;
  }

  if (rate.length >= MAX_EVENTS_PER_WINDOW) {
    const result = { ok: false, skipped: true, reason: "rate_limited", event: input?.event || null };
    logDelivery(result);
    return result;
  }

  const controller = new AbortController();
  const timeoutMs = Number.isFinite(input?.timeoutMs) ? input.timeoutMs : DEFAULT_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
      signal: controller.signal,
    });
    rate.push(now);
    recent.set(key, now);
    if (!response.ok) {
      const result = { ok: false, skipped: false, reason: `http_${response.status}`, event: input?.event || null };
      logDelivery(result);
      return result;
    }
    const result = { ok: true, skipped: false, event: input?.event || null };
    logDelivery(result);
    return result;
  } catch {
    const result = { ok: false, skipped: false, reason: "request_failed", event: input?.event || null };
    logDelivery(result);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
