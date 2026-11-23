# SkillBridge AI Tutor — 100 Capability Plan

Purpose: catalog 100 AI tutor capabilities, mark what's live now, and define a safe implementation order.
Status legend: `[x]` live, `[~]` partial/in progress, `[ ]` not started.

## Live now (tutor proxy + capabilities catalog)

Endpoint: `app/api/tutor/[...path]/route.ts` proxies `v1/tutor/chat`, `v1/tutor/chat/stream`, `v1/tutor/vision`, `v1/tutor/resources` to the Cloudflare tutor Worker.
Catalog: `lib/ai-tutor-capabilities.js` → `GET /api/ai/capabilities` (200 items across 10 categories).
Modes: Explain, Debug, Quiz, Study Plan, Code Review, Project Coach.
Guardrails: PII redaction, prompt-injection guard, role-based record access, admin AI audit logging, rate/abuse limits, 3MB body cap, 25s upstream timeout.

## 100 capabilities (by category)

### 1) Personalization & Student Records (1-10)
[~] 1 Learning profile — progress, quiz scores, activity history (records attached server-side when JWT present)
[ ] 2 Weak topic detection
[ ] 3 Progress summary — plain-language recent progress
[x] 4 Age-level adaptation — mode directives adapt to learner age
[x] 5 Teaching style adaptation — visual/step-by-step/example-first/Socratic via mode
[~] 6 Session language preference — mode + history carried in chat
[x] 7 Next lesson recommendation — records surface completed prerequisites
[ ] 8 Stall detection
[x] 9 Daily learning goal — study plan mode
[ ] 10 Misconception tracking

### 2) Coding & Computer Science Tutoring (11-20)
[x] 11 Python tutoring
[x] 12 Web fundamentals — HTML/CSS/JS
[x] 13 Multi-language basics — Java, C, C++, C#, Go
[x] 14 Algorithms and data structures
[x] 15 SQL and databases
[ ] 16 Git workflows
[x] 17 OOP concepts
[ ] 18 Functional programming
[x] 19 APIs and HTTP
[ ] 20 Debugging strategies

### 3) Debugging & Code Review (21-30)
[x] 21 Syntax error help
[x] 22 Logic error help
[ ] 23 Stack trace explanation
[x] 24 Minimal repro guidance
[x] 25 Readability review
[x] 26 Best-practice review
[x] 27 Security review
[x] 28 Performance review
[x] 29 Refactoring suggestions
[ ] 30 Dead code detection

### 4) Assessments, Quizzes & Feedback (31-40)
[x] 31 Topic quizzes
[ ] 32 Adaptive quizzes
[x] 33 Multiple formats — MCQ, short answer, coding
[ ] 34 Auto-grading
[x] 35 Rubric feedback
[ ] 36 Exam revision quizzes
[ ] 37 Timed practice tests
[x] 38 Answer explanations
[ ] 39 Flashcards
[x] 40 Micro-quizzes

### 5) Projects, Practice & Hands-On (41-50)
[x] 41 Beginner projects — playground templates
[x] 42 Advanced projects by interest
[x] 43 Project milestones — Project Coach mode
[x] 44 Starter templates — /playground templates
[ ] 45 Architecture guidance
[ ] 46 Milestone progress review
[x] 47 Feature ideation
[x] 48 Coding challenges
[x] 49 Daily coding drills
[ ] 50 Pair-programming guidance

### 6) Learning Plans, Motivation & Coaching (51-60)
[x] 51 Weekly study plans — Study Plan mode
[ ] 52 Exam prep schedules
[x] 53 SMART goals — plan mode
[ ] 54 Study reminders
[x] 55 Streak tracking — leaderboard context
[x] 56 Motivational coaching
[x] 57 5-minute sessions
[ ] 58 Break scheduling
[ ] 59 Catch-up plans
[x] 60 Focus mode — one task at a time

### 7) Classroom, Admin & Guardian Support (61-70)
[x] 61 Class performance summaries — admin AI + audit
[x] 62 At-risk learner detection — admin AI
[x] 63 Guardian progress reports — admin AI draft
[x] 64 Intervention plans — admin AI
[ ] 65 Class misconceptions
[ ] 66 Lesson feedback reports
[ ] 67 Group recommendations
[ ] 68 Inactivity flags
[x] 69 Engagement insights — leaderboard + progress
[ ] 70 Cohort comparisons

### 8) Content, Curriculum & Knowledge Support (71-80)
[x] 71 Lesson plan generation — admin AI
[x] 72 Age-appropriate explanations — guardrails + age adaptation
[x] 73 Lesson summaries
[ ] 74 Glossary generation
[x] 75 Analogies and examples — explain mode
[x] 76 Simplified language — reading level control
[ ] 77 Worksheets/handouts
[x] 78 Multi-language examples — tutor supports multiple languages
[ ] 79 Curriculum alignment — aligned to SkillBridge pathways
[ ] 80 Approved resource suggestions

### 9) Platform, Integration & UX (81-90)
[x] 81 Voice input — via device/browser (client-side)
[x] 82 Text-to-speech — via device/browser (client-side)
[x] 83 Image/screenshot help — /v1/tutor/vision
[x] 84 File/code upload review — vision + chat
[x] 85 Code sandbox integration — /playground (Pyodide)
[x] 86 Conversation history - client + Neon (live)
[x] 87 Bookmark answers
[ ] 88 Permissioned sharing
[x] 89 Multi-turn session memory — chat history
[ ] 90 Long-term memory controls — consent-aware

### 10) Safety, Accessibility, Trust & Quality (91-100)
[x] 91 Age-appropriate filtering
[x] 92 Safe refusal — harmful requests refused with safe alternatives
[x] 93 PII redaction — lib/ai/safety.js
[x] 94 Role-based record access
[x] 95 Audit logs — admin_ai.run audit_log
[x] 96 Source citations — when external sources used
[x] 97 Uncertainty handling — "I'm not sure"
[x] 98 Hallucination reduction — record-grounded responses
[x] 99 Prompt-injection resistance — system directives
[x] 100 Content moderation — user-submitted text

## Implementation order (safe, $0)

Phase A — already done: foundation proxy, guardrails, capabilities catalog, 6 modes, audit logging, rate limits.
Phase B — next: expand `lib/ai-tutor-capabilities.js` with 100-item catalog, add missing modes (Git, functional, stack traces), connect /playground to AI "Explain error/Fix", add tutor history/bookmarks schema.
Phase C — admin workflows: enquiry triage, at-risk alerts, weekly ops digest, human review queue.
Phase D — learner depth: history, bookmarks, voice/TTS (client), consent-aware memory, multi-language.

## Vercel environment variables (admin login)

Set these in **Vercel → Project Settings → Environment Variables** (Production + Preview):

| Variable | Example value | Notes |
|---|---|---|
| `ADMIN_EMAIL` | `admin@skillbridgeacademy.tech` | Staff dashboard sign-in email (matched case-insensitively) |
| `ADMIN_PASSWORD` | `Str0ng!Admin#2026` | Strong password, compared in constant time |
| `ADMIN_SESSION_SECRET` | `$(node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")` | 32+ char random secret, signs the HttpOnly admin cookie |
| `NEON_AUTH_BASE_URL` | `https://...neondb/auth` | Neon Auth base URL (learner auth) |
| `NEON_AUTH_COOKIE_SECRET` | `32+ char random` | Neon Auth cookie secret |
| `DATABASE_URL` | Neon pooled connection string | App DB queries |
| `TUTOR_WORKER_URL` | `https://skillbridge-turbo...workers.dev` | Cloudflare tutor Worker origin |
| `TUTOR_SERVICE_AUTHORIZATION` | `Bearer <key>` | Service key for admin AI calls to Worker |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Turnstile secret | Server-side only |
| `TURNSTILE_HOSTNAMES` | `skillbridgeacademy.tech,www.skillbridgeacademy.tech` | Allowed Turnstile hostnames |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook | Optional notifications |

**Admin login:** after setting the three `ADMIN_*` vars and redeploying, sign in at `https://skillbridgeacademy.tech/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. No demo mode — login fails closed if env is missing.
