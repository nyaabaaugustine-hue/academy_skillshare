import "server-only";

import { applicationDefault, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

type AnnouncementPayload = {
  announcementId: string;
  title: string;
  body: string;
};

type SendResult = {
  sent: number;
  invalidTokens: string[];
  enabled: boolean;
};

let warned = false;

function credential() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    return cert(JSON.parse(inline) as Record<string, string>);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    return applicationDefault();
  }
  return null;
}

/**
 * FCM is best-effort: announcements are always stored so the in-app inbox is
 * the source of truth. Push delivery is skipped (with one clear warning) until
 * a service account is configured.
 */
function messaging() {
  const googleCredential = credential();
  if (!googleCredential) {
    if (!warned) {
      console.warn(
        "FCM is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (or GOOGLE_APPLICATION_CREDENTIALS) to send push notifications.",
      );
      warned = true;
    }
    return null;
  }
  const app = getApps().length ? getApp() : initializeApp({ credential: googleCredential });
  return getMessaging(app);
}

export function fcmEnabled() {
  return credential() !== null;
}

export async function sendAnnouncement(
  tokens: string[],
  payload: AnnouncementPayload,
): Promise<SendResult> {
  const service = messaging();
  if (!service) return { sent: 0, invalidTokens: [], enabled: false };

  const unique = [...new Set(tokens.map((token) => token.trim()).filter(Boolean))];
  let sent = 0;
  const invalidTokens: string[] = [];

  for (let index = 0; index < unique.length; index += 500) {
    const chunk = unique.slice(index, index + 500);
    const batch = await service.sendEachForMulticast({
      tokens: chunk,
      data: {
        type: "announcement",
        announcementId: payload.announcementId,
        title: payload.title,
        body: payload.body,
      },
    });

    sent += batch.successCount;
    batch.responses.forEach((response, responseIndex) => {
      if (response.success) return;
      const code = response.error?.code ?? "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        invalidTokens.push(chunk[responseIndex]);
      }
    });
  }

  return { sent, invalidTokens, enabled: true };
}
