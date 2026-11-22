# Cloudflare Free-Tier Integration

This project keeps **Neon Postgres** as the primary database and integrates
Cloudflare only through optional, additive, free-tier services. Missing keys
disable the related feature gracefully; no paid API is enabled automatically.

## Services implemented in code

| Service | Purpose | Code |
| --- | --- | --- |
| Turnstile | Server-verified bot protection on contact, school enquiry, admin login | `lib/cloudflare/turnstile.js`, `components/turnstile-widget.js` |
| Web Analytics | Privacy-conscious page analytics beacon | `app/layout.js` |
| Usage guard | Free-tier thresholds + optional read-only usage API | `lib/cloudflare/usage.js` |
| Admin dashboard | Status, setup checklist, usage warnings | `app/admin/cloudflare/page.js` |

Existing **Workers AI** tutor integration remains via `TUTOR_WORKER_URL`.
**R2 is intentionally not used** because enabling it requires a Cloudflare subscription confirmation. Use free alternatives instead: Cloudinary (already used for media), `/public` static assets, Neon Postgres for metadata, or external links.

## Environment variables

Copy the Cloudflare block from `.env.example` and fill only what you use.

- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` — optional, read-only usage.
- `CLOUDFLARE_TURNSTILE_SITE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET_KEY` — server verification. The public site key can also be supplied via `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`.
- `CLOUDFLARE_R2_*` — intentionally unused; keep blank. R2 requires Cloudflare subscription confirmation, so prefer free alternatives (Cloudinary, `/public`, Neon metadata, external links).
- `CLOUDFLARE_AI_GATEWAY_ID` — optional gateway id.
- `CLOUDFLARE_WEB_ANALYTICS_TOKEN` / `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` — analytics beacon.

Never commit real values. Secrets stay server-side.

## Manual dashboard setup

1. Sign in to Cloudflare (free plan).
2. **Turnstile**: Add a site, copy the site key + secret key. Add both to the
   deployment env. Turnstile is only enforced when the secret key is set.
3. **Web Analytics**: Create a free Web Analytics site, copy the beacon token.
4. **API token**: Create a read-only token with analytics access for the account
   (least privilege). Add `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN`.
5. **AI Gateway** (optional): Create a gateway, add its id.
6. **Storage**: Do not use R2 (requires subscription confirmation). Use free alternatives: Cloudinary, `/public` assets, Neon metadata, or external file links.
7. Deploy the Next.js app and open `/admin/cloudflare` to confirm status.

## Free-tier guardrails

- `lib/cloudflare/usage.js` uses conservative defaults and warns at 80%.
- No billing, plan upgrade, or paid provider is configured by the app.
- If usage data is unavailable, admins get a dashboard link instead.
- AI requests continue to use the existing worker; no paid fallback is added.

## Testing

Run `npm test`, `npm run lint`, and `npm run build`. Tests cover config/service
status, Turnstile helper behavior, and the capabilities/admin surfaces.
