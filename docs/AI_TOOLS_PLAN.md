# AI Tools Plan (SkillBridge Academy)

## Goal
Add a unified AI tools layer to SkillBridge Academy, covering learning, admin, content, analytics, media, and compliance workflows. All 100 catalog tools are registered; high-value tools are implemented first, remaining tools are phased in.

## Current foundation
- **Tutor proxy**: `app/api/tutor/[...path]/route.ts` forwards chat/vision/resources to Cloudflare Worker (`TUTOR_WORKER_URL`).
- **Auth**: Admin session (`lib/admin-auth.js`) and learner Neon Auth (`lib/auth/server.ts`).
- **Data**: Neon Postgres via `lib/db.js`; tables include learners, course_progress, leaderboard, school_enquiries, lms_courses, news_posts, team_members, pwa_apps, etc.
- **Admin UI**: `/admin/*` pages with shared shell/nav.

## Architecture
1. **Catalog** - `lib/ai-tools-catalog.js` registers all 100 tools with id, category, status (`available|beta|planned`), and description.
2. **Execution API** - `POST /api/admin/ai/run` (admin-only) accepts `{ toolId, input, options }`.
   - Builds tool-specific prompt/instructions.
   - Attaches relevant DB context (including student records) for authorized admin tools.
   - Calls Cloudflare tutor worker `/v1/tutor/chat` server-side and returns structured result.
3. **Student records access** - Admin AI tools can read all student/learner records through server-side DB queries. Access is:
   - **Admin-authenticated only** (`requireAdmin` / session check).
   - **Read-only** for AI context assembly.
   - **Auditable** (future: write audit_log entries per AI run).
   - **Scoped by tool** - only tools that need records receive them.
4. **Admin UI** - `/admin/ai` lists all 100 tools, filters by category/status, and runs available tools.
5. **Safety** - PII minimization in prompts where possible, no secrets in prompts, rate limiting, audit logging, human review for sensitive actions.

## Status
| Status | Count | Meaning |
|---|---:|---|
| available | 35 | Works now via generic AI execution API and/or DB context |
| planned | 65 | Registered in catalog; needs dedicated implementation/integration |

## Phased rollout
### Phase 1 - Foundation (this change)
- Tool catalog with all 100 tools.
- Admin-only AI run API with Cloudflare tutor backend.
- Student-record context for admin AI tools (learners, progress, enquiries, LMS, leaderboard).
- Admin AI Tools page with search/filter/run.

### Phase 2 - LMS deep integration
- Per-learner progress summarizer, at-risk detector, recommendations, certificate checks.
- Cohort analytics, attendance, parent reports.
- Audit log for every AI run and data access.

### Phase 3 - Content & media
- Slide/PDF generation, translation, accessibility audits.
- Image/audio/video/transcription/caption tools with media providers.
- Diagram/screenshot-to-code pipelines.

### Phase 4 - Ops, security, integrations
- Ticket triage, sentiment, escalation, moderation.
- Text-to-SQL with guarded read-only sandbox.
- PII redaction, prompt-injection detection, policy checks.
- Webhooks, CRM/calendar/payments integrations, human handoff.

## Student records access policy
- AI can access all student records **only in admin-authenticated server routes**.
- Default context includes: learners, course_progress, course_progress_events, leaderboard_entries, school_enquiries, lms_courses.
- Sensitive fields (password hashes, secrets, tokens) must never be sent to models.
- Add audit trail and data-retention controls before enabling external-model access in production.
