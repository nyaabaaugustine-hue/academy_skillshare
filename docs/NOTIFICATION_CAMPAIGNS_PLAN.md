# Centralized Notification System — Implementation Plan

Master scope: centralized push notification management for the SkillBridge Academy
stack (Next.js on Vercel + Neon PostgreSQL + Firebase Cloud Messaging + web push + in-app inbox).

Companion to: `docs/VERCEL_ENV_SETUP.md`, `db/013_fcm_campaigns.sql`, `lib/notification-campaigns.js`.

## Requirements covered

1. **Single source of truth** — PostgreSQL is the canonical store of users, devices,
   campaigns, deliveries, and read state. No platform-only state.
2. **Push delivery** — Firebase Cloud Messaging (FCM) as the primary push path for
   Android/iOS/web; existing VAPID web push kept as the web fallback path.
3. **In-app notification centre** — per-user inbox persisted in Postgres, shared across
   web + mobile clients.
4. **Admin campaign management** — compose (title, body, image, deep link, category,
   audience, platform, schedule), send now / schedule / cancel / retry, delivery
   analytics, in-app read analytics.
5. **User preferences** — per-user, per-category `push_enabled` / `in_app_enabled`.
6. **Scheduling** — Vercel Cron → `/api/cron/notifications` → batch due campaigns.
7. **Safety** — admin auth required on every admin mutation; server-side secrets only;
   minimal data in push payloads (no PII beyond what the campaign author entered).

## Database design (db/013_fcm_campaigns.sql)

- `user_devices` — FCM tokens per user (`user_id`, `fcm_token` unique, `platform`,
  `device_name`, `app_version`, `is_active`, `last_seen_at`). Indexes on user + platform.
- `notification_campaigns` — campaign row (`campaign_name`, `title`, `message`, `image_url`,
  `action_url`, `category`, `audience_type`, `audience_filter jsonb`, `platform_filter jsonb`,
  `status`, `scheduled_at`, `sent_at`, `created_by`, `idempotency_key`, `targeted_users`,
  `targeted_devices`, `success_count`, `failure_count`).
- `notification_deliveries` — per-device/per-user delivery outcome
  (`campaign_id`, `notification_id`, `device_id`, `user_id`, `delivery_status`,
  `provider_message_id`, `error_code`, `error_message`, `attempt_count`, `attempted_at`,
  `delivered_at`).
- `notification_preferences` — per-user/per-category toggles
  (`user_id`, `category`, `push_enabled`, `in_app_enabled`, unique `(user_id, category)`).
- `notifications.campaign_id` — links in-app records back to originating campaigns
  (for read analytics + dedup).

All statements idempotent; applied via `npm run db:install`.

## Implemented (Phase 1–4, this repo state)

- `lib/firebase-admin.js` — server-side FCM init via env (`FIREBASE_PROJECT_ID`,
  `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`); `sendFcmToTokens` with multicast.
  Returns `{ ok: false, skipped: true, reason: "firebase_not_configured" }` when unconfigured.
- `lib/notification-campaigns.js` — create/list/get campaigns, resolve audience, process
  (lock → create in-app records → FCM send → delivery rows → final status), cancel, retry,
  analytics, scheduled-due processing.
- Admin API:
  - `POST /api/admin/notifications/campaigns` (admin-gated) — create.
  - `GET /api/admin/notifications/campaigns` (admin-gated) — list w/ filters.
  - `GET /api/admin/notifications/campaigns/[id]` (admin-gated) — analytics.
  - `POST /api/admin/notifications/campaigns/[id]/send` (admin-gated) — send now.
  - `POST /api/admin/notifications/campaigns/[id]/retry` (admin-gated) — retry failed.
  - `POST /api/admin/notifications/campaigns/[id]/cancel` (admin-gated) — cancel draft/scheduled.
- Admin UI: `/admin/notifications/campaigns` (list), `/admin/notifications/compose`
  (composer client + page), campaign detail page with send/retry/cancel + delivery breakdown.
- User API: `GET/POST /api/notifications/preferences`, `POST/DELETE /api/notifications/devices/register`.
- Cron: `GET /api/cron/notifications` (Bearer `CRON_SECRET`) → processes due scheduled campaigns.
- Vercel: `vercel.json` cron `0 9 * * *` → `/api/cron/notifications`.

## Remaining work (Phase 5+)

- **Firebase project wiring (manual/external):** create project, enable FCM, add Android/iOS/
  web apps, download service account JSON, set `FIREBASE_*` env vars, generate VAPID keys
  (`npx web-push generate-vapid-keys`), set `VAPID_*`/`NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
- **Vercel env:** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
  `NEXT_PUBLIC_FIREBASE_*`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`
  (+ existing admin/db/tutor/Resend/Slack/Turnstile vars) — see `docs/VERCEL_ENV_SETUP.md`.
- **Flutter integration (blocked on source):** register FCM tokens from the mobile app via
  `/api/notifications/devices/register`; consume in-app notifications via shared user id;
  deep links from `data.link`. Without Flutter source the APK cannot be rebuilt.
- **Web push migration decision:** VAPID (current) vs FCM (unified). Backend now supports both
  via FCM env-gating; web SW path unchanged unless migrated.
- **Analytics dashboard:** per-campaign delivery stats; aggregate admin digest already exists.
- **Acceptance criteria:** admin can compose → send/schedule; users get in-app + push;
  preferences honored; failed tokens deactivated; cron delivers on time.

## Safety notes

- All admin campaign endpoints call `assertAdmin()` (cookie session, HMAC, 8h).
- Push payloads contain only campaign-authored title/body/link — no PII from learner records.
- FCM service account + private keys server-side only; public Firebase web keys are fine.
- Scheduled campaigns processed server-side only; cron secret protected.
