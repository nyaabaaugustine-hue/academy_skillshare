# SkillBridge Academy — 100 Project Improvements Plan

## Purpose
Track and implement 100 improvements for the SkillBridge Academy website/platform. This is a living plan: implement in small, safe, testable slices.

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

## 1) Homepage & Public UX
- [x] 1. Improve “Be part of the change” section — premium cards, clearer CTAs, direct enquiry actions.
- [ ] 2. Add CTA destinations for involvement cards (dedicated pages/flows where needed).
- [ ] 3. Add impact stats section (learners reached, schools supported, workshops, communities).
- [ ] 4. Add testimonials/carousel (learners, parents, teachers, partners).
- [ ] 5. Improve hero messaging clarity and CTA hierarchy.
- [ ] 6. Add trust signals (partner/school logos, endorsements).
- [ ] 7. Add upcoming events calendar.
- [ ] 8. Improve mobile navigation (sticky CTA, clearer grouping).
- [ ] 9. Add FAQ section.
- [ ] 10. Add accessibility quick wins (contrast, skip links, focus states, ARIA).
- [ ] 11. Add localization/i18n structure.
- [ ] 12. Improve footer (contact, social, newsletter, privacy/terms, quick links).
- [ ] 13. Add newsletter signup.
- [ ] 14. Add social proof for courses.
- [ ] 15. Create dedicated landing pages (schools, parents, volunteers, partners).

## 2) Courses, Trainings & Bootcamps
- [x] 16. Make trainings admin-managed in Neon DB (admin CRUD + homepage DB-backed with fallback).
- [ ] 17. Add training detail pages.
- [ ] 18. Add registration status (Open/Closing Soon/Full/Waitlist/Completed).
- [ ] 19. Add seat/capacity tracking.
- [ ] 20. Add filters/search (age, format, date, topic, level, location).
- [ ] 21. Add calendar integration.
- [ ] 22. Add instructor/facilitator profiles.
- [ ] 23. Add course prerequisites.
- [ ] 24. Add downloadable syllabus.
- [ ] 25. Add training testimonials/outcomes.

## 3) Enquiry, Registration & Conversion
- [ ] 26. Add enquiry status pipeline.
- [ ] 27. Add enquiry source tracking.
- [ ] 28. Add auto-confirmation email.
- [ ] 29. Add admin enquiry notes.
- [ ] 30. Add duplicate enquiry detection.
- [ ] 31. Add enquiry assignment.
- [ ] 32. Add follow-up reminders.
- [ ] 33. Add enquiry export (CSV/Excel).
- [ ] 34. Add multi-step registration form.
- [ ] 35. Add WhatsApp/call CTA.

## 4) Admin Dashboard & Operations
- [ ] 36. Add dashboard KPI cards.
- [ ] 37. Add “Needs attention” panel.
- [ ] 38. Add global admin search.
- [ ] 39. Add audit log.
- [ ] 40. Add role-based access control.
- [ ] 41. Add admin activity timeline.
- [ ] 42. Add bulk actions.
- [ ] 43. Add saved filters/views.
- [ ] 44. Add pagination/server-side tables.
- [ ] 45. Add admin notification center.
- [ ] 46. Add content draft/preview/publish workflow.
- [ ] 47. Add admin onboarding/help.
- [ ] 48. Add mobile-friendly admin UI.
- [ ] 49. Add configurable settings page.
- [ ] 50. Add admin health/status page.

## 5) Learner Accounts & Auth
- [x] 51. Unify/improve learner login experience (web login/forgot/reset pages added; Flutter app overlay added).
- [ ] 52. Add account profile page.
- [ ] 53. Add email verification status UI.
- [ ] 54. Add secure branded password reset emails.
- [ ] 55. Add MFA/2FA option.
- [ ] 56. Add session/device management.
- [ ] 57. Add guardian account management UI.
- [ ] 58. Add guardian invitation email branding in actual sending flow.
- [ ] 59. Add account deletion/data request flow.
- [ ] 60. Add login activity logs.

## 6) AI Tutor & AI Tools
- [ ] 61. Add AI usage dashboard.
- [ ] 62. Add AI conversation quality feedback.
- [ ] 63. Add AI safety/PII redaction.
- [ ] 64. Add human escalation flow.
- [ ] 65. Add AI prompt/version management.
- [ ] 66. Add knowledge base/RAG.
- [ ] 67. Add role-aware AI responses.
- [ ] 68. Add AI tool permissions.
- [ ] 69. Add AI response caching.
- [ ] 70. Add AI evaluation tests.

## 7) Content & CMS
- [ ] 71. Add rich content editor.
- [ ] 72. Add media library.
- [ ] 73. Add image optimization pipeline.
- [ ] 74. Add SEO fields.
- [ ] 75. Add content scheduling.
- [ ] 76. Add revision history.
- [ ] 77. Add broken link checker.
- [ ] 78. Add content approval workflow.

## 8) Performance & Technical Quality
- [ ] 79. Improve Core Web Vitals.
- [ ] 80. Add server-side caching/revalidation strategy.
- [ ] 81. Add error monitoring.
- [ ] 82. Add structured logging.
- [ ] 83. Add automated tests.
- [ ] 84. Add CI checks.
- [ ] 85. Add type safety migration.
- [ ] 86. Add performance budgets.

## 9) Security, Privacy & Compliance
- [ ] 87. Add rate limiting to public endpoints.
- [ ] 88. Add CSP and security headers.
- [ ] 89. Add input validation/schema validation.
- [ ] 90. Add secrets/config audit.
- [ ] 91. Add PII data minimization/retention rules.
- [ ] 92. Add backup/restore plan.
- [ ] 93. Add privacy/terms/cookie pages.

## 10) Integrations, Analytics & Growth
- [ ] 94. Complete Slack notification maturity (delivery logs, dedupe, summaries).
- [ ] 95. Add analytics dashboard.
- [ ] 96. Add CRM integration option.
- [ ] 97. Add email marketing integration.
- [ ] 98. Add payment/donation flow (approved/compliant).
- [ ] 99. Add school partner portal.
- [ ] 100. Add roadmap/public changelog.

## Implementation Notes
- Implement in small slices; run lint/test/build per slice.
- Keep $0/free-tier constraints where possible.
- Never expose secrets/PII in client code or notifications.
- Neon remains source of truth; Cloudflare add-ons stay optional/free-tier.
