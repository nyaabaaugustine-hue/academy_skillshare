import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdmin } from "../../../lib/admin-auth";
import { cloudflarePublicConfig } from "../../../lib/cloudflare/public-config";
import TurnstileWidget from "../../../components/turnstile-widget";

export const metadata = { title: "Forgot password — SkillBridge Admin" };

export default async function AdminForgotPasswordPage({ searchParams }) {
  if (await isAdmin()) redirect("/admin");

  const params = await searchParams;
  const error = params?.error;

  return (
    <>
      <span className="admin-eyebrow">PASSWORD ASSISTANCE</span>
      <h1>Forgot your password?</h1>
      <p className="admin-gate-copy">
        Admin access is managed by the SkillBridge system administrator. Request
        assistance below and we&apos;ll notify the administrator through the
        configured secure channel.
      </p>

      {error === "rate" ? (
        <p className="admin-alert admin-alert-error" role="alert">
          Too many requests. Wait a few minutes and try again.
        </p>
      ) : null}
      {error === "turnstile" ? (
        <p className="admin-alert admin-alert-error" role="alert">
          Bot verification failed. Please try again.
        </p>
      ) : null}
      {error === "invalid" ? (
        <p className="admin-alert admin-alert-error" role="alert">
          Enter a valid email address.
        </p>
      ) : null}

      <form
        action="/api/admin/forgot-password"
        method="post"
        className="admin-form admin-login-form"
      >
        <label className="admin-field">
          <span>Admin email address</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            placeholder="you@skillbridge.tech"
            autoFocus
            required
          />
        </label>
        <TurnstileWidget
          siteKey={cloudflarePublicConfig().turnstileSiteKey}
          action="admin-forgot-password"
        />
        <button
          type="submit"
          className="admin-button admin-button-primary admin-login-submit"
        >
          Request reset assistance <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="admin-forgot-note">
        <p>
          <strong>System administrator?</strong> Update{" "}
          <code>ADMIN_PASSWORD</code> in your deployment environment variables and
          redeploy/restart as needed.
        </p>
      </div>

      <div className="admin-gate-links">
        <Link href="/admin/login">← Back to sign in</Link>
        <a href="mailto:support@skillbridge.tech?subject=Admin%20password%20reset%20assistance">
          Contact support
        </a>
      </div>
    </>
  );
}
