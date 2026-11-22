"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import { setNewPassword } from "../../lib/web-auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    if (status === "sending") return;
    setError("");

    if (!token) {
      setError("This reset link is invalid or has expired. Please request a new one.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      await setNewPassword(password);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="auth-card">
      <span className="eyebrow"><span />SET NEW PASSWORD</span>
      <h1>Create a new password</h1>
      <p className="auth-copy">
        Choose a strong password for your SkillBridge account. Use at least 12 characters with uppercase, lowercase, and a number.
      </p>

      {!token ? (
        <div className="auth-success" role="alert">
          <h2>Reset link missing</h2>
          <p>This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="button button-primary">Request a new reset link</Link>
        </div>
      ) : status === "sent" ? (
        <div className="auth-success" role="status">
          <span className="enquiry-tick" aria-hidden="true">✓</span>
          <h2>Password updated</h2>
          <p>Your password has been reset successfully. You can now sign in with your new password.</p>
          <Link href="/login" className="button button-primary">Sign in</Link>
        </div>
      ) : (
        <form className="school-form auth-form" onSubmit={onSubmit}>
          <div className="form-field form-field-wide">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={12}
            />
          </div>
          <div className="form-field form-field-wide">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={12}
            />
          </div>

          {status === "error" ? (
            <p className="form-note form-note-error form-field-wide" role="alert">{error}</p>
          ) : null}

          <div className="form-field-wide auth-actions">
            <button type="submit" className="button button-primary" disabled={status === "sending"}>
              {status === "sending" ? "Updating password…" : "Update password"}
            </button>
            <Link href="/login" className="text-link">Back to sign in</Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <section className="auth-shell">
          <Suspense fallback={<div className="auth-card"><p>Loading…</p></div>}>
            <ResetPasswordForm />
          </Suspense>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
