#!/usr/bin/env node
/**
 * Safe environment checker. Prints set/missing only — never secret values.
 *
 * Usage:
 *   npm run env:check
 *   node --env-file=.env.local scripts/check-env.mjs
 */

const required = [
  ["DATABASE_URL", "Neon Postgres pooled connection string"],
  ["NEON_AUTH_BASE_URL", "Neon Auth base URL"],
  ["NEON_AUTH_COOKIE_SECRET", "32+ char random cookie secret"],
  ["ADMIN_EMAIL", "Admin dashboard sign-in email"],
  ["ADMIN_PASSWORD", "Admin dashboard password"],
  ["ADMIN_SESSION_SECRET", "32+ char random admin cookie secret"],
];

const recommended = [
  ["SITE_URL", "Canonical site URL (https://www.skillbridgeacademy.tech)"],
  ["NEXT_PUBLIC_SITE_URL", "Public canonical site URL"],
  ["TUTOR_WORKER_URL", "Cloudflare tutor Worker origin"],
  ["TUTOR_SERVICE_AUTHORIZATION", "Bearer service key for admin AI"],
  ["SLACK_WEBHOOK_URL", "Slack incoming webhook for ops alerts"],
  ["RESEND_API_KEY", "Resend API key for transactional email"],
  ["EMAIL_FROM", "Verified sender, e.g. SkillBridge <hello@domain>"],
  ["CLOUDFLARE_TURNSTILE_SECRET_KEY", "Turnstile server secret"],
  ["TURNSTILE_HOSTNAMES", "Allowed Turnstile hostnames"],
];

const optional = [
  ["ADMIN_NOTIFICATION_EMAIL", "Ops inbox for enquiry/digest emails"],
  ["EMAIL_REPLY_TO", "Reply-to address for outgoing email"],
  ["CLOUDFLARE_TURNSTILE_SITE_KEY", "Turnstile public site key"],
  ["NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY", "Public Turnstile site key"],
  ["NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN", "Cloudflare analytics beacon"],
  ["FLUTTER_APP_ORIGIN", "Separate Flutter app origin, if any"],
  ["NEXT_PUBLIC_LEARN_URL", "Separate learner app URL, if any"],
];

function status(key) {
  const raw = process.env[key];
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { ok: false, label: "MISSING" };
  }
  const value = String(raw).trim();
  const weak = key.includes("SECRET") && value.length < 32;
  return { ok: true, label: weak ? `SET (weak: ${value.length} chars, need 32+)` : "SET" };
}

function printGroup(title, rows, { failOnMissing = false } = {}) {
  console.log(`\n${title}`);
  let missing = 0;
  for (const [key, hint] of rows) {
    const s = status(key);
    if (!s.ok) missing += 1;
    console.log(`  ${s.ok ? "OK  " : "MISS"} ${key.padEnd(42)} ${s.label}`);
    if (!s.ok && hint) console.log(`       ${hint}`);
  }
  return failOnMissing ? missing : 0;
}

console.log("SkillBridge environment check");
console.log("(values are never printed)");

const missingRequired = printGroup("Required", required, { failOnMissing: true });
printGroup("Recommended", recommended);
printGroup("Optional", optional);

console.log("\nAdmin sign-in: /admin/login (ADMIN_EMAIL + ADMIN_PASSWORD)");
console.log("Learner sign-in: /login · Register: /register · Account: /account");
console.log("Email is skipped safely when RESEND_API_KEY is absent.");
console.log("Apply DB migrations: npm run db:install (needs NEON_OWNER_DATABASE_URL).");

if (missingRequired > 0) {
  console.error(`\n${missingRequired} required variable(s) missing. The app may fail closed.`);
  process.exitCode = 1;
} else {
  console.log("\nAll required variables are set.");
}
