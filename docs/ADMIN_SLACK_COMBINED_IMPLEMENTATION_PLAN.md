# SkillBridge Admin + Slack Combined Implementation Plan

## Objective
Implement the 250 admin dashboard improvements and the no-money Slack/operations plan in a practical, phased way using **free tiers, existing stack, and willpower**.

## Constraints
- **$0 budget**: no paid Slack plans, paid monitoring, paid SMS, or subscription-gated infrastructure.
- **No R2 / no Cloudflare subscription confirmation**: use free alternatives (Cloudinary, `/public`, Neon metadata, external links).
- **Secrets server-side only**: Slack webhooks/tokens, Cloudflare secrets, DB creds never exposed to browser/chat.
- **Neon is source of truth**: Slack/admin notifications are views/actions, not primary data stores.
- **Privacy/PII first**: do not post full student records, passwords, tokens, or sensitive tutor transcripts to Slack.
- **Small safe slices**: ship, test, lint, build, deploy.

## Current Baseline (already in repo)
- Admin auth, protected `/admin`, dashboard, enquiries, learners, students, LMS, news, team, apps, AI tools.
- `/admin/cloudflare` status/guardrails; Turnstile/Web Analytics/usage guard (env-gated).
- AI tutor capabilities catalog/API and student-record-aware tutor context.
- Tests/lint/build passing as of latest push.

## Workstreams

### WS1 — Slack & Notifications (No Money)
- Slack free incoming webhooks for admin alerts.
- Discord/Telegram/email fallback if Slack limits are restrictive.
- GitHub Actions free cron for daily summaries/health checks.
- Minimal payloads, private channels, audit logs.

### WS2 — Admin UX & Data Workflow
- Navigation, tables, filters, detail views, statuses, notes, bulk actions.
- Enquiries, learners, LMS, content, AI tool workflows.

### WS3 — Data Model & Audit
- Neon schema additions for statuses, assignees, notes, audit logs, notifications, feature flags.
- Migrations/additive SQL; no destructive changes without backup.

### WS4 — AI Tutor/Admin AI Operations
- Usage/error review, escalation queue, safety/PII redaction, human approval, capability management.

### WS5 — Security, Ops, Reliability
- RBAC/audit, config checks, health/diagnostics, free-tier guardrails, incident playbooks.

## Phased Roadmap

## Phase 0 — Foundation & Guardrails (Week 1)
**Goal:** make implementation safe and observable.
- Add implementation tracker (`docs/` checklist or GitHub Issues/Projects free).
- Add env/config checklist for Slack webhook URLs (server-only).
- Add admin audit log table/schema design (additive).
- Add notification event schema: `event_type`, `severity`, `payload_redacted`, `status`, `created_at`.
- Add feature flags/config for notifications and risky UI changes.
- Add “no secrets/PII in Slack” policy doc.

**Covers:** 166-190 partially, 211-230 partially, Slack cautions.

## Phase 1 — Quick Wins / High Value (Weeks 1-2)
**Goal:** immediate operational value with minimal risk.

#### Slack/Notifications
- New enquiry notification to Slack webhook.
- New contact form notification to Slack webhook.
- Deploy failure/success notification via Vercel/GitHub free integration.
- Daily admin summary via GitHub Actions cron (enquiries count, new learners, errors).
- Minimal payloads: type, timestamp, short ID/ref, admin link.

#### Admin Dashboard
- Overview KPI cards: enquiries, learners, courses, AI status.
- “Needs attention” panel.
- Enquiry status field (New/Contacted/Qualified/Enrolled/Closed).
- Enquiry filters/search/saved view basics.
- Internal notes for enquiries.
- Toasts, empty/error/loading states.
- Global admin search (basic).

**Covers:** 1-20 selected, 21-40 selected, 41-65 selected, 191-210 selected; Slack plan items 1-4.

## Phase 2 — Admissions & Learner Workflow (Weeks 3-4)
**Goal:** make admin usable for daily admissions and learner management.
- Enquiry assignment, due/follow-up dates, overdue highlighting.
- Enquiry timeline/audit log.
- Duplicate detection/merge for enquiries.
- CSV export/import (validated) for enquiries.
- Learner profile page, statuses, tags, notes, activity timeline.
- Learner filters/search/segments.
- At-risk/inactive learner view.
- Bulk actions with confirmation.

**Covers:** 41-65, 66-90.

## Phase 3 — LMS/Content Operations (Weeks 5-6)
**Goal:** improve content and course management.
- Course draft/published/archived states.
- Content preview, autosave, revision history.
- News/team SEO/alt-text/completeness checks.
- Content calendar and scheduled publishing (simple cron/GitHub Actions or manual publish queue).
- APK/PWA version status tracker (manual metadata).
- Broken link/image checks (simple script).

**Covers:** 91-115, 146-165.

## Phase 4 — AI Tutor/Admin AI Maturity (Weeks 7-8)
**Goal:** make AI useful, safe, and observable.
- AI run history, errors, latency, usage counts.
- Flag bad AI response/escalation queue.
- Human approval before publishing AI-generated content.
- PII redaction rules for AI logs/Slack alerts.
- Capability catalog search/favorites in admin.
- Common tutor questions / knowledge-gap report (Neon aggregate, privacy-safe).
- Safe mode/fallback status indicators.

**Covers:** 116-145.

## Phase 5 — Security, RBAC & Compliance Hygiene (Weeks 9-10)
**Goal:** reduce operational risk.
- RBAC roles: admin/editor/support/viewer.
- Granular permissions by module.
- Admin action audit log UI.
- Login/session history; revoke sessions.
- MFA (free authenticator/TOTP) if feasible; otherwise strong password + session controls first.
- PII masking by role.
- Security checklist and config presence checks.

**Covers:** 166-190.

## Phase 6 — Analytics, Ops, Reliability (Weeks 11-12)
**Goal:** make operations measurable and resilient.
- Reports: enquiries funnel, learner growth, completion, tutor usage, content performance.
- Saved reports/exports.
- Service health panel: Neon, tutor worker, Cloudflare, Vercel.
- Error log viewer and diagnostics button.
- Webhook delivery logs/retries.
- Free-tier guardrail history and alerts.
- Incident mode banner/playbook.

**Covers:** 191-210, 211-230.

## Phase 7 — Polish, Accessibility, Performance (Ongoing)
**Goal:** production-quality admin experience.
- Keyboard/a11y/contrast/ARIA pass.
- Mobile admin UX improvements.
- Table performance: server-side pagination/search for large datasets.
- Caching/revalidation, optimistic UI where safe.
- In-app help/docs/playbooks.
- Feedback widget and admin issue reporting.

**Covers:** 231-250, remaining items from all sections.

## 250 Improvements Mapping

| Phase | Improvement IDs | Focus |
|---|---:|---|
| 0 | 166-170, 181, 188, 211, 216, 226, 229 | Foundation, guardrails, config |
| 1 | 1-13, 21-35, 41-53, 59, 191, 194, 198, 213 | Quick wins, visibility, enquiry basics |
| 2 | 14-15, 36, 41-90, 192-193, 201, 202, 206 | Admissions + learner workflows |
| 3 | 91-115, 146-165, 197, 198 | LMS/content/public content |
| 4 | 116-145, 196, 197, 209 | AI operations and safety |
| 5 | 166-190, 183-187 | Security, RBAC, audit, privacy |
| 6 | 191-230 | Reporting, ops, reliability |
| 7 | 231-250 + unfinished items | Accessibility, performance, polish |

> Note: Some IDs intentionally appear in multiple phases because they require incremental delivery (e.g., audit logs start simple, become full-featured later).

## Slack No-Money Plan (Integrated)

### Immediate (Free)
1. Create Slack free workspace/private admin channel.
2. Add Incoming Webhook; store URL in server env (`SLACK_WEBHOOK_URL` or similar), never client-side.
3. Send notifications from `/api/contact` and `/api/enquiries` after successful save; include admin link only.
4. Add Vercel/GitHub deployment notifications.
5. Add GitHub Actions scheduled daily summary.

### Next (Free, Willpower)
6. Add alert severity levels: info/warn/critical.
7. Add dedupe/throttle to avoid noisy Slack channels.
8. Add webhook delivery log table in Neon.
9. Add Discord/Telegram fallback provider abstraction.
10. Add staff action links back to admin pages (no direct destructive actions from Slack initially).

### Safety Rules
- No PII beyond minimal necessary business contact context; prefer “New enquiry #ID” + admin link.
- No secrets, tokens, DB rows, or raw tutor transcripts.
- Private channels only for operational alerts.
- Log notification attempts/errors in Neon.

## Implementation Order (Practical First 20 Tickets)
1. Add `SLACK_WEBHOOK_URL` to `.env.example` and server config.
2. Create `lib/notifications/slack.js` (server-only, timeout, safe payload).
3. Wire enquiry creation to Slack notification.
4. Wire contact form to Slack notification.
5. Add notification dedupe/throttle helper.
6. Add Neon table for notification logs (additive migration).
7. Add admin UI for recent notification deliveries.
8. Add overview KPI cards with real data.
9. Add enquiry status field + filter.
10. Add enquiry notes.
11. Add enquiry detail view.
12. Add audit log schema + write on enquiry updates.
13. Add basic global admin search.
14. Add loading/empty/error states standard component.
15. Add CSV export for enquiries.
16. Add daily summary GitHub Action.
17. Add health-check endpoint + status widget.
18. Add RBAC scaffold (roles in DB, guard helpers).
19. Add AI run/error log view.
20. Add accessibility pass checklist and fixes for top admin pages.

## Acceptance Criteria
- All new features work with free-tier services only.
- No secrets in client bundle, logs, git, or Slack messages.
- `npm test`, `npm run lint`, `npm run build` pass per slice.
- Additive DB changes; rollback plan for risky changes.
- Admin pages remain usable on mobile and keyboard.
- Every notification has redaction and failure handling.

## Suggested Repo Artifacts
- `docs/ADMIN_SLACK_COMBINED_IMPLEMENTATION_PLAN.md` (this plan)
- `docs/SLACK_NO_MONEY_SETUP.md` (setup checklist)
- `db/migrations/*_admin_notifications_audit.sql` (additive)
- `lib/notifications/*` (provider abstraction)
- `tests/admin-notifications.test.mjs` (redaction/delivery/failure cases)
