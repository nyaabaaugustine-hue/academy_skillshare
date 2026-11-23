import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let cached = null;

export function firebaseConfigured() {
  return Boolean(
    (process.env.FIREBASE_PROJECT_ID || "").trim() &&
    (process.env.FIREBASE_CLIENT_EMAIL || "").trim() &&
    (process.env.FIREBASE_PRIVATE_KEY || "").trim(),
  );
}

export function getFirebaseAdmin() {
  if (cached) return cached;
  if (!firebaseConfigured()) return null;
  try {
    const app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID.trim(),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          }),
        });
    cached = { app, messaging: getMessaging(app) };
    return cached;
  } catch {
    return null;
  }
}

export async function sendFcmToTokens(tokens, payload) {
  const admin = getFirebaseAdmin();
  if (!admin) return { ok: false, skipped: true, reason: "firebase_not_configured" };
  const unique = [...new Set((tokens || []).filter(Boolean))];
  if (unique.length === 0) return { ok: true, sent: 0, total: 0, results: [] };

  const message = {
    notification: {
      title: String(payload?.title || "SkillBridge Academy").slice(0, 100),
      body: String(payload?.body || "").slice(0, 500),
      ...(payload?.imageUrl ? { imageUrl: payload.imageUrl } : {}),
    },
    data: {
      type: String(payload?.type || "general").slice(0, 40),
      link: String(payload?.link || "/").slice(0, 500),
    },
    tokens: unique,
  };

  try {
    const res = await admin.messaging.sendEachForMulticast(message);
    return {
      ok: true,
      sent: res.successCount,
      failed: res.failureCount,
      total: unique.length,
      results: res.responses.map((r, i) => ({
        token: unique[i],
        ok: r.success,
        messageId: r.messageId,
        error: r.error ? r.error.code : null,
      })),
    };
  } catch (e) {
    return { ok: false, reason: e?.message || "fcm_send_failed" };
  }
}
