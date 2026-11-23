# Centralized Notification System — Full Implementation Plan

**Status:** Backend implemented & verified (build/lint/tests green). Remaining work = external configuration + Flutter source.

---

## ✅ Completed (Code)

### Phase 1 — Database (`db/013_fcm_campaigns.sql`, applied)
- `user_devices` — FCM tokens per user (`user_id`, `fcm_token` unique, `platform`, `device_name`, `app_version`, `is_active`, `last_seen_at`)
- `notification_campaigns` — title, message, image, action_url, category, audience_type, audience_filter jsonb, platform_filter jsonb, status, scheduled_at, sent_at, created_by, idempotency_key, targeted_users, targeted_devices, success_count, failure_count
- `notification_deliveries` — per-device outcomes (`campaign_id`, `notification_id`, `device_id`, `user_id`, `delivery_status`, `provider_message_id`, `error_code`, `error_message`, `attempt_count`, `attempted_at`, `delivered_at`)
- `notification_preferences` — per-user/per-category (`push_enabled`, `in_app_enabled`)
- `notifications.campaign_id` — link in-app records → originating campaign (for read analytics + dedup)

### Phase 2 — Backend libs
- `lib/firebase-admin.js` — env-gated `firebase-admin` init; `sendFcmToTokens` (multicast); skips when unconfigured.
- `lib/notification-campaigns.js` — create/list/get/resolve/process/cancel/retry/analytics/scheduler.

### Phase 3 — Admin API + UI
- `POST/GET /api/admin/notifications/campaigns` (admin-gated)
- `GET/POST /api/admin/notifications/campaigns/[id]` (analytics / detail)
- `POST /api/admin/notifications/campaigns/[id]/send|retry|cancel` (admin-gated)
- `/admin/notifications/campaigns` — list
- `/admin/notifications/compose` — composer
- `/admin/notifications/campaigns/[id]` — detail + send/retry/cancel

### Phase 4 — User API + Cron
- `GET/POST /api/notifications/preferences`
- `POST/DELETE /api/notifications/devices/register`
- `GET /api/cron/notifications` (Bearer `CRON_SECRET`) → processes due campaigns.

### Phase 5 — Infra / Docs
- `vercel.json` — cron `0 9 * * *` → `/api/cron/notifications`
- `.env.example` — FCM/VAPID/CRON vars added.
- `docs/VERCEL_ENV_SETUP.md` — FCM + Cron sections added.
- `docs/NOTIFICATION_CAMPAIGNS_PLAN.md` — full plan.

### Phase 6 — Session fixes
- `app/notifications/NotificationsClient.js` — NUL corruption removed; `react-hooks/set-state-in-effect` fixed via async IIFE + `cancelled` flag.
- `app/components/image-protection.js` + `app/layout.js` — **removed entirely** (mobile blur bug fixed).

### Verification
- `npm run build` ✅ · `npm run lint` ✅ (0 errors) · `npm test` ✅ (42/42 pass).

---

## ⏳ **Pending** (External / Manual / Blocked)

### P0 — External
1. **Firebase project** — create → enable FCM → add Android/iOS/web apps → download service account JSON → set env vars:
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
2. **Vercel env vars** — fill in actual values for:
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `NEXT_PUBLIC_FIREBASE_*`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`
   - + existing: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `DATABASE_URL`, `NEON_AUTH_*`, `TUTOR_WORKER_URL`, `TUTOR_SERVICE_AUTHORIZATION`, Resend, Turnstile, Slack.

3. **Admin env values** — put real strong values in Vercel for `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.

### P1 — Blocked
4. **Flutter source** — not in workspace; only `public/app/` compiled bundle + APK. FCM device registration (`/api/notifications/devices/register`) + in-app notifications in Flutter cannot be wired without source.

5. **“Download for Android & iOS” buttons** — need compiled app; iOS via PWA add-to-home-screen, Android via APK.

---

## 🎯 Suggested Next Actions

1. Write final implementation plan doc (this file).
2. Clean up any leftover code/docs references (e.g., CSS for `sb-protected-blur` now dead — could be removed but harmless).
3. Verify `.env.local` has local dev values filled.
4. Document final checklist for the user to execute in Vercel/Firebase dashboards.
5. Commit + push final cleanup commit.

---

## 🔜 Deferred / Low Priority

- Web push → FCM migration decision (VAPID fallback already works).
- Firebase Analytics + per-campaign analytics dashboards.
- Flutter FCM integration once source lands.

---

## ✅ Final Acceptance Criteria

- [x] Notification system backend complete.
- [x] Admin campaign flow (create/send/schedule/retry/cancel/analytics) complete.
- [x] User prefs + device registration + in-app inbox complete.
- [x] Cron scheduling complete.
- [x] Lint/build/tests green.
- [x] Mobile blur fix complete.
- [ ] Firebase project created & env wired in Vercel.
- [ ] Vercel env vars all populated.
- [ ] Admin creds set in Vercel.
- [ ] Flutter source integrated (blocked).

---

*End of plan.*
