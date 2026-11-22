# AI 50-Feature Implementation Plan

## Principles
- Additive, non-breaking changes only.
- $0/free-tier compatible; no paid providers or billing.
- Secrets server-side only; PII minimization/redaction in logs/prompts.
- Neon remains primary DB; no rebuild of working flows.
- Admin AI remains admin-gated; learner tutor remains user-scoped.

## Phase 1 - Foundation (implementing now)
| # | Feature | Status | Implementation |
|---|---|---|---|
| 31 | PII redaction layer | In progress | Centralize key-based redaction for AI record contexts; avoid secrets/tokens/passwords in prompts/logs. |
| 32 | Prompt injection guard | In progress | Add server-side safety directives in tutor proxy/admin AI prompts; ignore user attempts to override system/policy/data boundaries. |
| 37 | Audit trail viewer/logging | Implemented (foundation) | Admin AI runs logged to `audit_log` (`admin_ai.run`) with tool, status, record scopes, input length, redacted metadata; admin viewer at `/admin/ai-audit`. |
| 38 | Rate/abuse limits | Implemented (basic) | Payload/time limits plus in-memory admin AI run rate limit (15/5min) and 429 response; production should move to shared store if needed. |
| 39 | Model fallback policy | Partial | Existing fallback in admin AI run; keep graceful error handling. |
| 48 | Certificate/award caption generator | Available via tool | Already in admin AI catalog as content/copy capability; can be run through admin AI. |
| 3 | "Explain this lesson" button | In progress | Add tutor CTAs on programmes/course pages linking to learner app tutor with mode/query. |
| 21 | Enquiry AI triage | Available via tool | Admin AI can run with enquiry records; add quick prompt templates. |
| 23 | Follow-up draft generator | Available via tool | Admin AI quick prompt templates for enquiry follow-up. |
| 26 | Weekly ops digest | Available via tool | Admin AI quick prompt/report template. |
| 40 | Evaluation harness | In progress | Add/extend smoke tests for safety directives, redaction, audit logging, capabilities endpoint. |

## Phase 2 - Learner tutor product depth
| # | Feature | Status | Notes |
|---|---|---|---|
| 1 | Tutor conversation history | Planned | Needs Flutter app source or learner-app storage/API; add Neon schema + API first. |
| 2 | Bookmark tutor answers | Planned | Depends on history/storage. |
| 4 | Code sandbox run/check | Planned | Needs safe execution sandbox; Pyodide exists in app bundle, integrate carefully. |
| 5 | Hint ladder | Planned | Prompt mode + UI support in learner app. |
| 6 | Voice input/output | Planned | Browser speech APIs / free-tier TTS; accessibility review. |
| 7 | Image-to-debug | Partial | Vision route exists in proxy; needs learner UI. |
| 8 | Personalized recap | Planned | Session summary stored with consent. |
| 9 | Confidence check | Planned | UI + event capture. |
| 10 | Safe kid mode | Planned | Policy + UI toggle + stricter system prompt. |
| 11-20 | Assessment/learning path features | Planned | Requires LMS event schema, scoring, and UI surfaces. |

## Phase 3 - Admin/operations intelligence
| # | Feature | Status | Notes |
|---|---|---|---|
| 22 | Duplicate/spam enquiry detector | Partial | Email duplicate flag exists; add fuzzy/behavior signals. |
| 24 | Admin natural-language dashboard | Planned | Safe text-to-SQL/structured query layer over allowlisted views. |
| 25 | At-risk learner alerts | Planned | Needs activity thresholds and notification jobs. |
| 27 | Meeting notes to tasks | Available via tool | Tool exists; add upload/transcript workflow later. |
| 28 | Knowledge base Q&A | Planned | Index approved docs/content. |
| 29 | Guardian report draft | Planned | Template + consent/PII controls. |
| 30 | Content quality checker | Planned | Scheduled/content review workflow. |

## Phase 4 - Safety, trust, compliance
| # | Feature | Status | Notes |
|---|---|---|---|
| 33 | Output moderation | Planned | Add moderation pass/policy checks before display. |
| 34 | Citation/source mode | Planned | Requires source metadata from worker/RAG. |
| 35 | Human review queue | Planned | Admin queue for flagged outputs/actions. |
| 36 | Consent-aware memory | Planned | Schema + UI + deletion/export flow. |
| 39 | Model fallback policy | Planned | Multi-provider/fallback config; $0 constraints. |
| 41-50 | Growth/content features | Planned | Prioritize by marketing/LMS impact. |

## Implemented in this slice
- Plan document created.
- Admin AI run audit logging to `audit_log`.
- Centralized AI redaction/safety helpers.
- Prompt-injection resistance directives added to tutor/admin AI prompts.
- AI feature registry API (`/api/ai/features`) for the 50-feature roadmap status.
- Admin AI quick prompt templates for common ops workflows.
- Programmes page tutor CTAs (“Ask AI tutor”, mode links).
- Smoke/security tests updated.