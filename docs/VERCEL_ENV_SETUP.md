# Vercel Environment Variables - SkillBridge Academy

Generated from code references and `.env.example`. **Do not paste real secrets into chat or commit them.** Set values in Vercel: **Project → Settings → Environment Variables**. After adding/changing env vars, redeploy.

## Required (production)

| Key | Suggested value / format | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@...-pooler...neondb?sslmode=require` | Pooled Neon Postgres connection. Server-side only. |
| `NEON_AUTH_BASE_URL` | `https://...neonauth.../neondb/auth` | Managed Neon Auth base URL. |
| `NEON_AUTH_COOKIE_SECRET` | random 32+ chars | Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ADMIN_EMAIL` | `support@skillbridgeacademy.tech` | Admin sign-in email (case-insensitive match). |
| `ADMIN_PASSWORD` | strong password | Admin dashboard password. |
| `ADMIN_SESSION_SECRET` | random 32+ chars | Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.skillbridgeacademy.tech` | Public canonical site URL; used for absolute URLs/metadata. |
| `SITE_URL` | `https://www.skillbridgeacademy.tech` | Server-side site URL fallback. |

## Recommended

| Key | Suggested value / format | Notes |
|---|---|---|
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` | Server-side only. Enables Slack notifications for enquiries, project submissions/reports, awards, admin reset requests. |
| `NEXT_PUBLIC_APP_URL` | `https://www.skillbridgeacademy.tech` | Public app/site URL where referenced by code. |
| `NEXT_PUBLIC_LEARN_URL` | *(leave empty in production if same-origin)* | Only set if Flutter learner app is hosted on a different origin. |
| `FLUTTER_APP_ORIGIN` | *(leave empty in production if same-origin)* | Exact origin of separate Flutter build; must match `NEXT_PUBLIC_LEARN_URL` origin when used. |

## Optional integrations

| Key | Suggested value / format | Notes |
|---|---|---|
| `CLOUDFLARE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | Public. |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | same as site key | Public client-side Turnstile key. |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret | Server-side only. Enforced only when set. |
| `TURNSTILE_HOSTNAMES` | Comma-separated allowed frontend hostnames | Recommended in production (e.g. `skillbridgeacademy.tech,www.skillbridgeacademy.tech`). Do not include localhost in production. |
| `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` | Cloudflare Web Analytics token | Public beacon token. |
| `CLOUDFLARE_WEB_ANALYTICS_TOKEN` | same token if needed server-side | Public token; optional. |
| `TUTOR_WORKER_URL` | `https://...workers.dev` | AI tutor Worker URL. Server-side only. |
| `TUTOR_SERVICE_AUTHORIZATION` | `Bearer <TUTOR_SERVICE_KEY>` | Server-side only; never expose to browser. |

## Vercel-provided (usually no need to set)

| Key | Notes |
|---|---|
| `VERCEL_URL` | Provided by Vercel. |
| `VERCEL_PROJECT_PRODUCTION_URL` | Provided by Vercel. |
| `NODE_ENV` | Provided by runtime. |

## Unused / keep off unless intentionally enabled

| Key | Notes |
|---|---|
| `CLOUDFLARE_R2_*` | R2 intentionally not used (subscription confirmation declined). |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_AI_GATEWAY_ID` | Only for optional Cloudflare analytics/gateway flows; use least-privilege tokens. |

## Copy-paste checklist (fill placeholders)

```env
# Required
DATABASE_URL=
NEON_AUTH_BASE_URL=
NEON_AUTH_COOKIE_SECRET=
ADMIN_EMAIL=support@skillbridgeacademy.tech
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
NEXT_PUBLIC_SITE_URL=https://www.skillbridgeacademy.tech
SITE_URL=https://www.skillbridgeacademy.tech

# Recommended
SLACK_WEBHOOK_URL=
NEXT_PUBLIC_APP_URL=https://www.skillbridgeacademy.tech
NEXT_PUBLIC_LEARN_URL=
FLUTTER_APP_ORIGIN=

# Optional - Turnstile
CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAAGNKd_uKkUhFtuMt
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=0x4AAAAAAGNKd_uKkUhFtuMt
CLOUDFLARE_TURNSTILE_SECRET_KEY=
TURNSTILE_HOSTNAMES=skillbridgeacademy.tech,www.skillbridgeacademy.tech

# Optional - Cloudflare Web Analytics
NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN=
CLOUDFLARE_WEB_ANALYTICS_TOKEN=

# Optional - AI Tutor
TUTOR_WORKER_URL=
TUTOR_SERVICE_AUTHORIZATION=

# Optional - Firebase Cloud Messaging (FCM) for centralized push campaigns
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# Optional - Web push scheduling (Vercel Cron hits /api/cron/notifications)
CRON_SECRET=
```

## Firebase Cloud Messaging (optional, free)

| Key | Suggested value / format | Notes |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Firebase project id (e.g. `skillbridge-academy`) | Server-side. |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk@....iam.gserviceaccount.com` | Service account email. Server-side only. |
| `FIREBASE_PRIVATE_KEY` | Full private key incl. `\n` escapes | Server-side only; paste with literal `\n` line breaks. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web API key | Public. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` | Public. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | project id | Public. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender id | Public. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | app id | Public. |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | VAPID public key (from `npx web-push generate-vapid-keys`) | Public; used for FCM web push. |

- Enable Firebase Cloud Messaging in the Firebase console (Cloud Messaging → enable).
- Create a service account and download the JSON key; use `client_email`/`private_key`.
- Without these vars the backend FCM send path skips gracefully (web push via VAPID still works).

## Push scheduling (optional, Vercel Hobby cron)

| Key | Suggested value / format | Notes |
|---|---|---|
| `CRON_SECRET` | random 32+ chars | Shared secret sent as `Authorization: Bearer <CRON_SECRET>` to `/api/cron/notifications`. |

- `vercel.json` schedules `0 9 * * *` → `/api/cron/notifications` (daily batch of due campaigns; Hobby plan allows daily crons only).
- The cron picks up campaigns with `status='scheduled' and scheduled_at <= now()`, up to 10 per run, `for update skip locked`.

## Email (optional, Resend free tier)
| Key | Suggested value / format | Notes |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | Server-side only. Enables enquiry auto-replies, welcome emails, guardian consent requests, admin digests. |
| `EMAIL_FROM` | `SkillBridge Academy <hello@yourdomain>` | Must be a verified sender in Resend. |
| `EMAIL_REPLY_TO` | `support@skillbridgeacademy.tech` | Optional reply-to. |
| `ADMIN_NOTIFICATION_EMAIL` | `ops@skillbridgeacademy.tech` | Ops inbox; falls back to `ADMIN_EMAIL`. |

## Database migrations
Run once per environment (owner role):
```bash
npm run db:install
```
This applies `db/001`..`db/013` in order, including enquiry pipeline, tutor history/bookmarks, playground snippets, account preferences, award consent, notifications/push, FCM campaigns.

## Admin sign-in
- URL: `https://www.skillbridgeacademy.tech/admin/login`
- Username (email): value of `ADMIN_EMAIL`
- Password: value of `ADMIN_PASSWORD`
- If either is missing, login fails closed (no demo mode).

## Web push (optional, free)
| Key | Suggested value / format | Notes |
|---|---|---|
| `VAPID_PUBLIC_KEY` | base64url public key | Generate with `npx web-push generate-vapid-keys`. Safe to expose. |
| `VAPID_PRIVATE_KEY` | base64url private key | Server-side only. |
| `VAPID_SUBJECT` | `mailto:support@skillbridgeacademy.tech` | Contact for push service. |

## Quick sanity checks

- **Slack missing?** If `SLACK_WEBHOOK_URL` is not set in Vercel Production/Preview as intended, Slack notifications are skipped.
- **Auth issues?** Confirm `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, and `DATABASE_URL` point to the same Neon project/environment.
- **Admin issues?** Confirm `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` are set.
- **After changes:** redeploy the affected Vercel environment.
