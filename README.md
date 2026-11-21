# SkillBridge Academy

The SkillBridge public website, staff dashboard and learner web app host. The
site is built with Next.js, React, TypeScript/JavaScript and Neon Postgres, and
ships the Flutter learner app at `/app`.

## Requirements

- Node.js 20 LTS or newer
- npm
- A Neon Postgres database for the dashboard, LMS catalogue and enquiries

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The staff dashboard is at
http://localhost:3000/admin.

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values you need.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled Neon connection used by the dashboard and content queries. |
| `NEON_OWNER_DATABASE_URL` | Owner connection used only by `npm run db:install` to create tables. |
| `NEON_AUTH_BASE_URL` | Neon Auth endpoint for learner accounts. |
| `NEON_AUTH_COOKIE_SECRET` | 32+ character secret for Neon Auth cookies. |
| `ADMIN_EMAIL` | Staff dashboard email, e.g. `support@skillbridge.tech`. |
| `ADMIN_PASSWORD` | Staff dashboard password. |
| `ADMIN_SESSION_SECRET` | 32+ character secret that signs the HttpOnly admin cookie. |
| `NEXT_PUBLIC_LEARN_URL` | Optional separately hosted Flutter bundle. Leave unset to use `/app`. |

Generate the admin session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

There is no demo login. The dashboard accepts only the email and password in the
environment, and both are checked on the server. Set the same variables in your
hosting provider (for example Vercel) before going live.

## Database

Apply the schema once, then re-run it whenever `db/schema.sql` changes:

```bash
npm run db:install
```

The script is idempotent. It needs `NEON_OWNER_DATABASE_URL` (or a
`DATABASE_URL` role that can create tables). You can also paste
`db/schema.sql` into the Neon SQL editor.

## Staff dashboard

- Sign in at `/admin/login` with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- The overview shows enquiry and learner KPIs, the learner pipeline, recent
  activity, quick actions and the current homepage course spotlight.
- **LMS courses** manages the catalogue. Mark one published course as
  **Feature on the homepage** to control the upcoming-course section on `/`.
- The homepage falls back to the next published course, then to the curated
  Python for Beginners spotlight, if no course is featured.

## Learner app

Register and Login in the site header, and the course CTAs on the homepage,
open the Flutter learner app at `/app/index.html?v=2`. The app opens its own
sign-in and registration screens while signed out.

## Production build

```bash
npm run build
npm start
```

## Before publishing

1. Set strong values for `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` in the
   hosting environment.
2. Replace sample team biographies and placeholder contact details with approved
   information.
3. Add verified impact statistics and review the privacy, safeguarding and terms
   pages with the relevant leads.
4. Confirm the Neon Auth and learner app environment values for production.
