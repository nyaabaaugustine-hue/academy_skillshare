const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+?\d[\s().-]?){7,}\d/;

export function findPublicPii(value) {
  const text = String(value ?? "");
  if (EMAIL_RE.test(text)) return "email address";
  if (PHONE_RE.test(text)) return "phone number";
  return "";
}

export function assertNoPublicPii(fields) {
  for (const [label, value] of Object.entries(fields || {})) {
    const kind = findPublicPii(value);
    if (kind) return `${label} must not include a ${kind}. Use a first name/alias only.`;
  }
  return "";
}

export function publicLearnerName(value) {
  const raw = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return "SkillBridge Learner";
  // Keep it child-safe: first token/alias only, letters/numbers/basic punctuation.
  const first = raw.split(" ")[0].slice(0, 40);
  return first || "SkillBridge Learner";
}
