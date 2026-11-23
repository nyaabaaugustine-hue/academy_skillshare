import * as webpush from "web-push";
import { tryDb } from "./db";

const subject = () => (process.env.VAPID_SUBJECT || "mailto:support@skillbridgeacademy.tech").trim();
const publicKey = () => (process.env.VAPID_PUBLIC_KEY || "").trim();
const privateKey = () => (process.env.VAPID_PRIVATE_KEY || "").trim();

export function pushConfigured() {
  return Boolean(publicKey() && privateKey());
}

export function vapidPublicKey() {
  return publicKey();
}

function configure() {
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(subject(), publicKey(), privateKey());
  return true;
}

export async function sendPushToUser(userId, payload) {
  if (!pushConfigured()) return { ok: false, skipped: true, reason: "push_not_configured" };
  configure();
  const sql = tryDb();
  if (!sql) return { ok: false, skipped: true, reason: "db_unavailable" };

  let subs = [];
  try {
    subs = await sql`select endpoint, p256dh, auth from push_subscriptions where user_id = ${userId}`;
  } catch {
    return { ok: false, reason: "query_failed" };
  }

  const results = [];
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload || {}),
      );
      results.push({ ok: true, endpoint: sub.endpoint });
    } catch (e) {
      results.push({ ok: false, endpoint: sub.endpoint, error: e?.statusCode || e?.message });
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        try { await sql`delete from push_subscriptions where endpoint = ${sub.endpoint}`; } catch {}
      }
    }
  }
  return { ok: true, sent: results.filter((r) => r.ok).length, total: subs.length, results };
}

export async function sendPushToAll(payload) {
  if (!pushConfigured()) return { ok: false, skipped: true, reason: "push_not_configured" };
  configure();
  const sql = tryDb();
  if (!sql) return { ok: false, skipped: true, reason: "db_unavailable" };

  let subs = [];
  try { subs = await sql`select endpoint, p256dh, auth from push_subscriptions`; } catch { return { ok: false, reason: "query_failed" }; }

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload || {}));
      sent += 1;
    } catch (e) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        try { await sql`delete from push_subscriptions where endpoint = ${sub.endpoint}`; } catch {}
      }
    }
  }
  return { ok: true, sent, total: subs.length };
}
