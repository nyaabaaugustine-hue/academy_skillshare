import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdmin } from "../../../lib/admin-auth";
import { cloudflarePublicConfig } from "../../../lib/cloudflare/public-config";
import TurnstileWidget from "../../../components/turnstile-widget";

export const metadata = { title: "Admin sign in — SkillBridge" };

export default async function AdminLoginPage({ searchParams }) {
  if (await isAdmin()) redirect("/admin");

  const params = await searchParams;
  const error = params?.error;
  const next = typeof params?.next === "string" ? params.next : "/admin";

  return (
    <>
      <span className="admin-eyebrow">STAFF SIGN IN</span>
      <h1>Welcome back</h1>
      <p className="admin-gate-copy">
        Sign in with your SkillBridge operator email to manage enquiries, learners
        and the public site.
      </p>

      {error === "rate" ? (
        <p className="admin-alert admin-alert-error" role="alert">
          Too many attempts. Wait a few minutes and try again.
        </p>
      ) : null}
      {error === "1" ? (
        <p className="admin-alert admin-alert-error" role="alert">
          That email and password did not match. Check both and try again.
        </p>
      ) : null}
      {error === "turnstile" ? (
        <p className="admin-alert admin-alert-error" role="alert">
          Bot verification failed. Please try again.
        </p>
      ) : null}
      {params?.reset === "requested" ? (
        <p className="admin-alert admin-alert-ok" role="status">
          If that admin email is registered, password reset instructions have been sent to the system administrator.
        </p>
      ) : null}

      <form action="/api/admin/login" method="post" className="admin-form admin-login-form">
        <input type="hidden" name="next" value={next} />
        <label className="admin-field">
          <span>Email address</span>
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
        <label className="admin-field">
          <span className="admin-field-row">
            <span>Password</span>
            <Link href="/admin/forgot-password" className="admin-forgot-link">Forgot password?</Link>
          </span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        <TurnstileWidget siteKey={cloudflarePublicConfig().turnstileSiteKey} action="admin-login" />
        <button type="submit" className="admin-button admin-button-primary admin-login-submit">
          Sign in to the console <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="admin-gate-links">
        <Link href="/">← Back to the public site</Link>
        <a href="mailto:support@skillbridge.tech">Need access?</a>
      </div>
    </>
  );
}
