# AI Tutor 200 Capabilities — Plan & Safe Implementation Slice

## Goal
Add a roadmap and foundation for 200 AI tutor capabilities **without destroying the working app**. Implement additive, testable slices first; keep existing tutor/admin flows working.

## Current Safe Baseline (already in app)
- Same-origin tutor proxy with auth forwarding, CORS checks, allowlist, timeout, body limits.
- Server-side student record enrichment in tutor proxy (redacted, user-scoped).
- Smart/best-practice system directives injected server-side.
- Admin-gated AI tools catalog and run endpoint with redaction/limits.
- Premium floating AI tutor button.
- Tests, lint, build passing.

## 200-Capability Catalog
- Cataloged in `lib/ai-tutor-capabilities.js` (200 capabilities, 10 categories).
- Exposed read-only via `GET /api/ai/capabilities`.

## Implemented in this slice (additive)
1. **Capabilities catalog + API**
   - `lib/ai-tutor-capabilities.js`
   - `app/api/ai/capabilities/route.js`
2. **Tutor modes (safe prompt directives)**
   - Modes: `explain`, `debug`, `quiz`, `plan`, `review`, `project`
   - Proxy accepts `mode` / `tutorMode` in JSON body and injects a mode directive server-side.
3. **Floating button quick actions**
   - Adds quick mode links/buttons to open tutor with intent (UI additive; does not change existing open-tutor behavior).
4. **Tests**
   - Catalog count/category/mode integrity.
   - Proxy mode directive presence.

## Not yet implemented (requires phased work)
- Full vision/file upload UI in Flutter app (compiled app source not in repo).
- Persistent conversation memory with consent/deletion workflows.
- Push notifications/scheduling/calendar integrations.
- Guardian/teacher escalation workflows.
- Production-grade evaluation/hallucination scoring pipeline.
- Full Cloudflare worker deployment of local patched worker.

## Safety / Non-Breaking Rules
- Additive endpoints only; no removal of existing routes.
- Existing tutor request fields remain supported.
- Student records remain user-scoped, redacted, server-side.
- Admin AI remains admin-gated.
- Build/lint/tests must pass before push.
