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
```

## Quick sanity checks

- **Slack missing?** If `SLACK_WEBHOOK_URL` is not set in Vercel Production/Preview as intended, Slack notifications are skipped.
- **Auth issues?** Confirm `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, and `DATABASE_URL` point to the same Neon project/environment.
- **Admin issues?** Confirm `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` are set.
- **After changes:** redeploy the affected Vercel environment.
