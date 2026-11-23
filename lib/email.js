/**
 * Transactional email for the $0 stack.
 *
 * Resend's free tier (3,000 emails/month) is used through its REST API, so no
 * SDK or paid add-on is required. Email is always best-effort: a missing key or
 * provider outage must never lose an enquiry, award, or registration.
 *
 * Environment:
 *   RESEND_API_KEY             re_... (server-side only)
 *   EMAIL_FROM                 "SkillBridge Academy <hello@yourdomain>"
 *   EMAIL_REPLY_TO             optional reply-to address
 *   ADMIN_NOTIFICATION_EMAIL   optional ops inbox (falls back to ADMIN_EMAIL)
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "SkillBridge Academy <onboarding@resend.dev>";

export function emailConfigured() {
  return Boolean((process.env.RESEND_API_KEY || "").trim());
}

export function emailFrom() {
  return (process.env.EMAIL_FROM || "").trim() || DEFAULT_FROM;
}

export function adminNotificationEmail() {
  return (
    (process.env.ADMIN_NOTIFICATION_EMAIL || "").trim() ||
    (process.env.ADMIN_EMAIL || "").trim() ||
    ""
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textValue(value, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}

/** Small, email-client-safe branded wrapper. */
export function emailLayout({ title, intro, rows = [], body = "", ctaLabel, ctaUrl, footer }) {
  const rowHtml = rows
    .filter((row) => row && row.value)
    .map(
      (row) =>
        `<tr><td style="padding:6px 0;color:#64748b;font-size:14px;vertical-align:top;width:38%">${escapeHtml(
          row.label,
        )}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600">${escapeHtml(
          row.value,
        )}</td></tr>`,
    )
    .join("");

  const cta =
    ctaLabel && ctaUrl
      ? `<p style="margin:24px 0 8px"><a href="${escapeHtml(
          ctaUrl,
        )}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">${escapeHtml(
          ctaLabel,
        )}</a></p><p style="margin:0;color:#64748b;font-size:12px;word-break:break-all">${escapeHtml(
          ctaUrl,
        )}</p>`
      : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f1f5f9;padding:24px;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <tr><td style="background:#0f172a;padding:22px 28px">
      <div style="color:#5eead4;font-size:12px;letter-spacing:2px;font-weight:700">SKILLBRIDGE ACADEMY</div>
      <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:6px">${escapeHtml(title)}</div>
    </td></tr>
    <tr><td style="padding:26px 28px">
      ${intro ? `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.65">${escapeHtml(intro)}</p>` : ""}
      ${rowHtml ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 18px">${rowHtml}</table>` : ""}
      ${body ? `<div style="color:#334155;font-size:14px;line-height:1.7">${body}</div>` : ""}
      ${cta}
    </td></tr>
    <tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6">
      ${footer ? escapeHtml(footer) : "Learn Today. Innovate Tomorrow."}<br>
      SkillBridge Academy · <a href="https://www.skillbridgeacademy.tech" style="color:#0f766e">skillbridgeacademy.tech</a>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Send one email. Returns `{ ok, skipped, status, id, error }` and never throws.
 */
export async function sendEmail({ to, subject, html, text, replyTo, tags }) {
  const key = (process.env.RESEND_API_KEY || "").trim();
  const recipient = textValue(to, 320);
  if (!recipient) return { ok: false, skipped: true, error: "missing_recipient" };
  if (!key) return { ok: false, skipped: true, error: "email_not_configured" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom(),
        to: [recipient],
        subject: textValue(subject, 200),
        html,
        text: textValue(text, 10000),
        ...(process.env.EMAIL_REPLY_TO?.trim()
          ? { reply_to: process.env.EMAIL_REPLY_TO.trim() }
          : {}),
        ...(replyTo ? { reply_to: textValue(replyTo, 320) } : {}),
        ...(Array.isArray(tags) && tags.length
          ? { tags: tags.slice(0, 3).map((t) => ({ name: textValue(t.name, 40), value: textValue(t.value, 40) })) }
          : {}),
      }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        skipped: false,
        status: response.status,
        error: data?.message || data?.error || `email_http_${response.status}`,
      };
    }
    return { ok: true, skipped: false, status: response.status, id: data?.id || "" };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      error: error?.name === "AbortError" ? "email_timeout" : "email_unavailable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendEnquiryAutoReply(enquiry) {
  if (!enquiry?.email) return { ok: false, skipped: true, error: "missing_recipient" };
  const name = textValue(enquiry.contact_name, 120) || "there";
  const school = textValue(enquiry.school_name, 160);
  const html = emailLayout({
    title: "We received your enquiry",
    intro: `Hello ${name}, thank you for reaching out to SkillBridge Academy about ${school}. Our team has received your details and will reply within 2 working days.`,
    rows: [
      { label: "School", value: school },
      { label: "Location", value: textValue(enquiry.school_location, 160) },
      { label: "Programme", value: textValue(enquiry.programme_interest, 80) || "To be discussed" },
      { label: "Learners", value: textValue(enquiry.learner_count, 40) || "To be discussed" },
    ],
    body: `<p style="margin:0 0 12px">While you wait, you can explore our programmes, try the free Python playground, or read about our learner rewards.</p>`,
    ctaLabel: "Explore SkillBridge",
    ctaUrl: "https://www.skillbridgeacademy.tech/programmes",
    footer: "You received this email because you submitted an enquiry on skillbridgeacademy.tech.",
  });
  return sendEmail({
    to: enquiry.email,
    subject: "We received your SkillBridge Academy enquiry",
    html,
    text: `Hello ${name},\n\nThank you for contacting SkillBridge Academy about ${school}. We received your enquiry and will reply within 2 working days.\n\nProgrammes: https://www.skillbridgeacademy.tech/programmes\n\nSkillBridge Academy`,
    tags: [{ name: "type", value: "enquiry_autoreply" }],
  });
}

export async function sendEnquiryAdminAlert(enquiry) {
  const inbox = adminNotificationEmail();
  if (!inbox) return { ok: false, skipped: true, error: "missing_admin_email" };
  const html = emailLayout({
    title: "New school enquiry",
    intro: "A new enquiry was submitted on the website and is waiting in the admin dashboard.",
    rows: [
      { label: "School", value: textValue(enquiry.school_name, 160) },
      { label: "Contact", value: textValue(enquiry.contact_name, 120) },
      { label: "Email", value: textValue(enquiry.email, 200) },
      { label: "Phone", value: textValue(enquiry.phone, 60) },
      { label: "Learners", value: textValue(enquiry.learner_count, 40) },
      { label: "Programme", value: textValue(enquiry.programme_interest, 80) },
    ],
    body: enquiry.message
      ? `<p style="margin:0;padding:12px;background:#f8fafc;border-left:3px solid #0f766e">${escapeHtml(
          textValue(enquiry.message, 1200),
        )}</p>`
      : "",
    ctaLabel: "Open enquiry dashboard",
    ctaUrl: "https://www.skillbridgeacademy.tech/admin/enquiries",
    footer: "Admin notification from SkillBridge Academy.",
  });
  return sendEmail({
    to: inbox,
    subject: `New enquiry: ${textValue(enquiry.school_name, 120) || "School"}`,
    html,
    text: `New school enquiry from ${enquiry.contact_name} (${enquiry.email}) at ${enquiry.school_name}.`,
    tags: [{ name: "type", value: "enquiry_admin_alert" }],
  });
}

export async function sendWelcomeEmail({ name, email }) {
  if (!email) return { ok: false, skipped: true, error: "missing_recipient" };
  const learner = textValue(name, 120) || "learner";
  const html = emailLayout({
    title: "Welcome to SkillBridge Academy",
    intro: `Hi ${learner}, your SkillBridge account is ready. Here is how to get the most from your learning journey.`,
    body: `<ol style="margin:0 0 8px;padding-left:20px">
      <li style="margin-bottom:8px">Install the SkillBridge app on Android or iOS.</li>
      <li style="margin-bottom:8px">Try the free Python playground and run your first program.</li>
      <li style="margin-bottom:8px">Meet App Robot, your AI tutor, and pick a learning mode.</li>
      <li>Track progress on the leaderboard and earn certificates.</li>
    </ol>`,
    ctaLabel: "Open your account",
    ctaUrl: "https://www.skillbridgeacademy.tech/account",
    footer: "You received this email because an account was created at skillbridgeacademy.tech.",
  });
  return sendEmail({
    to: email,
    subject: "Welcome to SkillBridge Academy",
    html,
    text: `Hi ${learner}, welcome to SkillBridge Academy. Open your account: https://www.skillbridgeacademy.tech/account`,
    tags: [{ name: "type", value: "welcome" }],
  });
}

export async function sendAwardConsentRequest({ award, consentUrl, declineUrl }) {
  const guardian = textValue(award?.guardian_email, 200);
  if (!guardian) return { ok: false, skipped: true, error: "missing_guardian_email" };
  const learner = textValue(award.learner_alias || award.learner_name, 80) || "your learner";
  const html = emailLayout({
    title: "Guardian consent needed",
    intro: `SkillBridge Academy would like to celebrate ${learner}'s learning milestone with a shareable certificate. Please confirm whether you consent to a public certificate page.`,
    rows: [
      { label: "Learner", value: learner },
      { label: "Award", value: textValue(award.award_title, 160) },
      { label: "Milestone", value: textValue(award.milestone, 120) },
    ],
    body: `<p style="margin:0 0 12px">Only the learner’s first name or alias, award title, and milestone are shown. No email address, phone number, or school contact details are published.</p>
      <p style="margin:0 0 12px">If you do not consent, the certificate stays private and will not be shared publicly.</p>`,
    ctaLabel: "Review and give consent",
    ctaUrl: consentUrl,
    footer: "This consent request was sent to the guardian email recorded by SkillBridge Academy.",
  });
  const result = await sendEmail({
    to: guardian,
    subject: `Consent request: ${textValue(award.award_title, 120)}`,
    html,
    text: `SkillBridge Academy requests guardian consent to publish a certificate for ${learner}. Review: ${consentUrl}\nDecline: ${declineUrl}`,
    tags: [{ name: "type", value: "award_consent" }],
  });
  return result;
}

export async function sendAdminDigestEmail({ subject, html, text }) {
  const inbox = adminNotificationEmail();
  if (!inbox) return { ok: false, skipped: true, error: "missing_admin_email" };
  return sendEmail({
    to: inbox,
    subject: subject || "SkillBridge admin digest",
    html,
    text,
    tags: [{ name: "type", value: "admin_digest" }],
  });
}

export { escapeHtml, textValue };
