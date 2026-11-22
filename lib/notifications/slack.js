const DEFAULT_TIMEOUT_MS = 5000;

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

/**
 * Send a minimal Slack notification. Server-only. Never include secrets, tokens,
 * full student records, or unnecessary PII in `text`.
 */
export async function sendSlackNotification({ text, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const url = webhookUrl();
  if (!url) return { ok: false, skipped: true, reason: "not_configured" };
  if (typeof text !== "string" || text.trim() === "") {
    return { ok: false, skipped: true, reason: "empty_text" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim().slice(0, 3000) }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return { ok: false, skipped: false, reason: `http_${response.status}` };
    }
    return { ok: true, skipped: false };
  } catch {
    return { ok: false, skipped: false, reason: "request_failed" };
  } finally {
    clearTimeout(timeout);
  }
}
