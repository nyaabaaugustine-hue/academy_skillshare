"use client";

import { useEffect } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export default function PushRegistration() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

      // Only subscribe signed-in learners.
      try {
        const res = await fetch("/api/account", { cache: "no-store", credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.user) return;
      } catch {
        return;
      }

      const keyRes = await fetch("/api/push/vapid-public-key", { cache: "no-store" });
      const keyData = await keyRes.json().catch(() => ({}));
      if (!keyData?.configured || !keyData?.publicKey) return;

      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const existing = await reg.pushManager.getSubscription();
        const sub = existing || await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
        });
        if (cancelled) return;

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: { p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")))), auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")))) },
            userAgent: navigator.userAgent,
          }),
        });
      } catch {
        // Push registration is best-effort.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return null;
}
