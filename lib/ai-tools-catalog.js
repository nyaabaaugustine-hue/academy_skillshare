export const AI_TOOL_CATEGORIES = [
  "Learning & Tutoring",
  "Coding & Technical",
  "Content & Course Creation",
  "LMS & Learner Operations",
  "Admin & Productivity",
  "Communication & Support",
  "Data & Analytics",
  "Web & Product",
  "Media & Creative",
  "Security, Compliance & Integrations",
];

export const AI_TOOLS = [
  // Learning & Tutoring
  { id: "lesson-explainer", no: 1, name: "Lesson explainer", category: "Learning & Tutoring", status: "available", description: "Explain a concept at beginner, intermediate, or advanced level." },
  { id: "quiz-generator", no: 2, name: "Quiz generator", category: "Learning & Tutoring", status: "available", description: "Create MCQ/short-answer quizzes from a lesson or topic." },
  { id: "answer-grader", no: 3, name: "Answer grader", category: "Learning & Tutoring", status: "available", description: "Grade learner answers with rubric-based feedback." },
  { id: "step-by-step-solver", no: 4, name: "Step-by-step solver", category: "Learning & Tutoring", status: "available", description: "Walk through math/coding problems with hints first." },
  { id: "flashcard-generator", no: 5, name: "Flashcard generator", category: "Learning & Tutoring", status: "available", description: "Turn lessons into spaced-repetition flashcards." },
  { id: "study-plan-builder", no: 6, name: "Study plan builder", category: "Learning & Tutoring", status: "available", description: "Create personalized weekly learning schedules." },
  { id: "concept-prerequisite-mapper", no: 7, name: "Concept prerequisite mapper", category: "Learning & Tutoring", status: "available", description: "Identify missing prerequisites for a topic." },
  { id: "practice-problem-generator", no: 8, name: "Practice problem generator", category: "Learning & Tutoring", status: "available", description: "Generate exercises by difficulty and topic." },
  { id: "socratic-tutor-mode", no: 9, name: "Socratic tutor mode", category: "Learning & Tutoring", status: "available", description: "Guide learners with questions instead of direct answers." },
  { id: "exam-prep-coach", no: 10, name: "Exam prep coach", category: "Learning & Tutoring", status: "available", description: "Generate mock exams and revision checklists." },

  // Coding & Technical
  { id: "code-reviewer", no: 11, name: "Code reviewer", category: "Coding & Technical", status: "available", description: "Review code for bugs, style, and security." },
  { id: "code-explainer", no: 12, name: "Code explainer", category: "Coding & Technical", status: "available", description: "Explain what a code snippet does line by line." },
  { id: "bug-diagnosis-tool", no: 13, name: "Bug diagnosis tool", category: "Coding & Technical", status: "available", description: "Analyze errors/logs and suggest fixes." },
  { id: "test-generator", no: 14, name: "Test generator", category: "Coding & Technical", status: "available", description: "Generate unit/integration tests for code." },
  { id: "refactor-assistant", no: 15, name: "Refactor assistant", category: "Coding & Technical", status: "available", description: "Propose cleaner/refactored implementations." },
  { id: "sql-query-builder", no: 16, name: "SQL query builder", category: "Coding & Technical", status: "available", description: "Generate/optimize SQL from natural language." },
  { id: "api-client-generator", no: 17, name: "API client generator", category: "Coding & Technical", status: "planned", description: "Generate fetch/SDK code for APIs." },
  { id: "regex-builder-explainer", no: 18, name: "Regex builder/explainer", category: "Coding & Technical", status: "available", description: "Create and explain regular expressions." },
  { id: "code-translation-tool", no: 19, name: "Code translation tool", category: "Coding & Technical", status: "planned", description: "Convert code between languages/frameworks." },
  { id: "project-scaffold-generator", no: 20, name: "Project scaffold generator", category: "Coding & Technical", status: "planned", description: "Generate starter project structures." },

  // Content & Course Creation
  { id: "course-outline-generator", no: 21, name: "Course outline generator", category: "Content & Course Creation", status: "available", description: "Build module/lesson outlines from a goal." },
  { id: "lesson-draft-writer", no: 22, name: "Lesson draft writer", category: "Content & Course Creation", status: "available", description: "Draft lesson content in your brand voice." },
  { id: "assignment-generator", no: 23, name: "Assignment generator", category: "Content & Course Creation", status: "available", description: "Create projects, rubrics, and submission criteria." },
  { id: "slide-deck-generator", no: 24, name: "Slide deck generator", category: "Content & Course Creation", status: "planned", description: "Turn lessons into presentation slides." },
  { id: "video-script-writer", no: 25, name: "Video script writer", category: "Content & Course Creation", status: "available", description: "Generate scripts for educational videos." },
  { id: "worksheet-pdf-generator", no: 26, name: "Worksheet/PDF generator", category: "Content & Course Creation", status: "planned", description: "Create printable learning materials." },
  { id: "content-simplifier", no: 27, name: "Content simplifier", category: "Content & Course Creation", status: "available", description: "Rewrite content for different reading levels." },
  { id: "translation-localization-tool", no: 28, name: "Translation/localization tool", category: "Content & Course Creation", status: "planned", description: "Translate course content into local languages." },
  { id: "accessibility-checker", no: 29, name: "Accessibility checker", category: "Content & Course Creation", status: "planned", description: "Suggest alt text, captions, and readable formatting." },
  { id: "curriculum-gap-analyzer", no: 30, name: "Curriculum gap analyzer", category: "Content & Course Creation", status: "planned", description: "Find missing topics in a course catalog." },

  // LMS & Learner Operations
  { id: "learner-progress-summarizer", no: 31, name: "Learner progress summarizer", category: "LMS & Learner Operations", status: "planned", description: "Summarize a learner’s progress and blockers." },
  { id: "at-risk-learner-detector", no: 32, name: "At-risk learner detector", category: "LMS & Learner Operations", status: "planned", description: "Flag learners likely to drop off." },
  { id: "personalized-recommendation-engine", no: 33, name: "Personalized recommendation engine", category: "LMS & Learner Operations", status: "planned", description: "Recommend next lessons/courses." },
  { id: "enrollment-assistant", no: 34, name: "Enrollment assistant", category: "LMS & Learner Operations", status: "planned", description: "Guide users through registration/enrollment." },
  { id: "certificate-eligibility-checker", no: 35, name: "Certificate eligibility checker", category: "LMS & Learner Operations", status: "planned", description: "Verify completion requirements." },
  { id: "feedback-summarizer", no: 36, name: "Feedback summarizer", category: "LMS & Learner Operations", status: "available", description: "Summarize course/learner feedback themes." },
  { id: "cohort-analytics-reporter", no: 37, name: "Cohort analytics reporter", category: "LMS & Learner Operations", status: "planned", description: "Generate cohort performance reports." },
  { id: "learning-path-optimizer", no: 38, name: "Learning path optimizer", category: "LMS & Learner Operations", status: "planned", description: "Adapt paths based on performance." },
  { id: "attendance-session-tracker-assistant", no: 39, name: "Attendance/session tracker assistant", category: "LMS & Learner Operations", status: "planned", description: "Log and summarize attendance." },
  { id: "parent-guardian-progress-report-generator", no: 40, name: "Parent/guardian progress report generator", category: "LMS & Learner Operations", status: "planned", description: "Create readable progress updates." },

  // Admin & Productivity
  { id: "admin-dashboard-insights", no: 41, name: "Admin dashboard insights", category: "Admin & Productivity", status: "planned", description: "Natural-language queries over dashboard data." },
  { id: "report-generator", no: 42, name: "Report generator", category: "Admin & Productivity", status: "available", description: "Generate weekly/monthly operational reports." },
  { id: "email-draft-assistant", no: 43, name: "Email draft assistant", category: "Admin & Productivity", status: "available", description: "Draft replies to enquiries/applicants." },
  { id: "crm-note-summarizer", no: 44, name: "CRM note summarizer", category: "Admin & Productivity", status: "planned", description: "Summarize contact/enquiry histories." },
  { id: "task-extractor", no: 45, name: "Task extractor", category: "Admin & Productivity", status: "available", description: "Turn messages/meetings into action items." },
  { id: "meeting-summarizer", no: 46, name: "Meeting summarizer", category: "Admin & Productivity", status: "available", description: "Summarize transcripts into decisions/tasks." },
  { id: "calendar-scheduling-assistant", no: 47, name: "Calendar scheduling assistant", category: "Admin & Productivity", status: "planned", description: "Propose meeting times and agendas." },
  { id: "document-qa", no: 48, name: "Document Q&A", category: "Admin & Productivity", status: "planned", description: "Answer questions from internal docs/policies." },
  { id: "sop-generator", no: 49, name: "SOP generator", category: "Admin & Productivity", status: "available", description: "Turn processes into standard operating procedures." },
  { id: "knowledge-base-search", no: 50, name: "Knowledge base search", category: "Admin & Productivity", status: "planned", description: "Semantic search across internal resources." },

  // Communication & Support
  { id: "customer-support-chatbot", no: 51, name: "Customer support chatbot", category: "Communication & Support", status: "available", description: "Answer common website/LMS questions." },
  { id: "ticket-triage-classifier", no: 52, name: "Ticket triage classifier", category: "Communication & Support", status: "planned", description: "Categorize and prioritize support tickets." },
  { id: "sentiment-analyzer", no: 53, name: "Sentiment analyzer", category: "Communication & Support", status: "planned", description: "Detect sentiment/urgency in messages." },
  { id: "multilingual-chat-support", no: 54, name: "Multilingual chat support", category: "Communication & Support", status: "planned", description: "Respond in the user’s preferred language." },
  { id: "faq-generator", no: 55, name: "FAQ generator", category: "Communication & Support", status: "available", description: "Generate FAQs from support logs/docs." },
  { id: "escalation-detector", no: 56, name: "Escalation detector", category: "Communication & Support", status: "planned", description: "Identify issues needing human handoff." },
  { id: "onboarding-assistant", no: 57, name: "Onboarding assistant", category: "Communication & Support", status: "planned", description: "Guide new users through setup." },
  { id: "notification-composer", no: 58, name: "Notification composer", category: "Communication & Support", status: "available", description: "Draft SMS/email/push announcements." },
  { id: "community-moderation-assistant", no: 59, name: "Community moderation assistant", category: "Communication & Support", status: "planned", description: "Flag harmful/spam content." },
  { id: "live-chat-copilot", no: 60, name: "Live chat copilot", category: "Communication & Support", status: "planned", description: "Suggest replies for human support agents." },

  // Data & Analytics
  { id: "text-to-sql-analyst", no: 61, name: "Text-to-SQL analyst", category: "Data & Analytics", status: "planned", description: "Query databases using natural language." },
  { id: "chart-generator", no: 62, name: "Chart generator", category: "Data & Analytics", status: "planned", description: "Turn data into charts and visual summaries." },
  { id: "anomaly-detector", no: 63, name: "Anomaly detector", category: "Data & Analytics", status: "planned", description: "Flag unusual metrics or behavior." },
  { id: "forecasting-tool", no: 64, name: "Forecasting tool", category: "Data & Analytics", status: "planned", description: "Predict enrollments, churn, or demand." },
  { id: "ab-test-analyzer", no: 65, name: "A/B test analyzer", category: "Data & Analytics", status: "planned", description: "Summarize experiment results and significance." },
  { id: "data-cleaning-assistant", no: 66, name: "Data cleaning assistant", category: "Data & Analytics", status: "planned", description: "Detect missing/invalid/inconsistent data." },
  { id: "etl-pipeline-assistant", no: 67, name: "ETL pipeline assistant", category: "Data & Analytics", status: "planned", description: "Generate data transformation scripts." },
  { id: "kpi-explainer", no: 68, name: "KPI explainer", category: "Data & Analytics", status: "planned", description: "Explain why metrics changed." },
  { id: "survey-analyzer", no: 69, name: "Survey analyzer", category: "Data & Analytics", status: "planned", description: "Extract themes from open-ended responses." },
  { id: "dashboard-narrative-generator", no: 70, name: "Dashboard narrative generator", category: "Data & Analytics", status: "planned", description: "Write plain-language metric summaries." },

  // Web & Product
  { id: "website-copy-optimizer", no: 71, name: "Website copy optimizer", category: "Web & Product", status: "available", description: "Improve landing page copy for clarity/conversion." },
  { id: "seo-content-assistant", no: 72, name: "SEO content assistant", category: "Web & Product", status: "available", description: "Suggest titles, meta descriptions, and keywords." },
  { id: "ui-ux-critique-tool", no: 73, name: "UI/UX critique tool", category: "Web & Product", status: "planned", description: "Review screens and suggest usability improvements." },
  { id: "accessibility-audit-tool", no: 74, name: "Accessibility audit tool", category: "Web & Product", status: "planned", description: "Check WCAG issues in UI/content." },
  { id: "form-builder-assistant", no: 75, name: "Form builder assistant", category: "Web & Product", status: "planned", description: "Generate forms and validation rules." },
  { id: "feature-spec-writer", no: 76, name: "Feature spec writer", category: "Web & Product", status: "available", description: "Turn ideas into PRDs/user stories." },
  { id: "release-notes-generator", no: 77, name: "Release notes generator", category: "Web & Product", status: "available", description: "Create release notes from commits/changes." },
  { id: "bug-report-structurer", no: 78, name: "Bug report structurer", category: "Web & Product", status: "available", description: "Convert user reports into reproducible issues." },
  { id: "changelog-summarizer", no: 79, name: "Changelog summarizer", category: "Web & Product", status: "available", description: "Summarize product changes for users." },
  { id: "personalization-engine", no: 80, name: "Personalization engine", category: "Web & Product", status: "planned", description: "Tailor homepage/content by user segment." },

  // Media & Creative
  { id: "image-generator", no: 81, name: "Image generator", category: "Media & Creative", status: "planned", description: "Create illustrations/graphics from prompts." },
  { id: "image-editor", no: 82, name: "Image editor", category: "Media & Creative", status: "planned", description: "Edit images with natural-language instructions." },
  { id: "text-to-speech-tool", no: 83, name: "Text-to-speech tool", category: "Media & Creative", status: "planned", description: "Convert lessons into audio." },
  { id: "speech-to-text-transcriber", no: 84, name: "Speech-to-text transcriber", category: "Media & Creative", status: "planned", description: "Transcribe audio/video lessons." },
  { id: "video-summarizer", no: 85, name: "Video summarizer", category: "Media & Creative", status: "planned", description: "Summarize videos into key points and timestamps." },
  { id: "caption-subtitle-generator", no: 86, name: "Caption/subtitle generator", category: "Media & Creative", status: "planned", description: "Create accessible captions." },
  { id: "avatar-tutor-presenter", no: 87, name: "Avatar/tutor presenter", category: "Media & Creative", status: "planned", description: "Generate a talking tutor avatar for lessons." },
  { id: "diagram-generator", no: 88, name: "Diagram generator", category: "Media & Creative", status: "planned", description: "Create flowcharts, architecture, or concept diagrams." },
  { id: "screenshot-to-code-ui-tool", no: 89, name: "Screenshot-to-code/UI tool", category: "Media & Creative", status: "planned", description: "Convert UI screenshots into code drafts." },
  { id: "background-remover-enhancer", no: 90, name: "Background remover/enhancer", category: "Media & Creative", status: "planned", description: "Clean up images for course materials." },

  // Security, Compliance & Integrations
  { id: "pii-redaction-tool", no: 91, name: "PII redaction tool", category: "Security, Compliance & Integrations", status: "planned", description: "Detect and redact sensitive personal data." },
  { id: "policy-compliance-checker", no: 92, name: "Policy/compliance checker", category: "Security, Compliance & Integrations", status: "planned", description: "Check content against policies/GDPR rules." },
  { id: "prompt-injection-detector", no: 93, name: "Prompt injection detector", category: "Security, Compliance & Integrations", status: "planned", description: "Flag malicious/untrusted instructions in inputs." },
  { id: "auth-audit-log-analyzer", no: 94, name: "Auth/audit log analyzer", category: "Security, Compliance & Integrations", status: "planned", description: "Summarize suspicious auth/admin activity." },
  { id: "secrets-config-auditor", no: 95, name: "Secrets/config auditor", category: "Security, Compliance & Integrations", status: "planned", description: "Detect missing or risky environment/config settings." },
  { id: "file-document-parser", no: 96, name: "File/document parser", category: "Security, Compliance & Integrations", status: "planned", description: "Extract structured data from PDFs/docs/uploads." },
  { id: "webhook-workflow-automation-tool", no: 97, name: "Webhook/workflow automation tool", category: "Security, Compliance & Integrations", status: "planned", description: "Trigger actions across systems." },
  { id: "calendar-crm-integration-tool", no: 98, name: "Calendar/CRM integration tool", category: "Security, Compliance & Integrations", status: "planned", description: "Connect AI actions to external systems." },
  { id: "payments-billing-assistant", no: 99, name: "Payments/billing assistant", category: "Security, Compliance & Integrations", status: "planned", description: "Handle invoices, receipts, and billing queries." },
  { id: "human-handoff-escalation-tool", no: 100, name: "Human handoff/escalation tool", category: "Security, Compliance & Integrations", status: "planned", description: "Route complex cases to a human with context." },
];

export function getAiTool(id) {
  return AI_TOOLS.find((t) => t.id === id) || null;
}
