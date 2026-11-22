"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import { requestPasswordReset } from "../../lib/web-auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      await requestPasswordReset(email);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email. Please try again.");
      setStatus("error");
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <section className="auth-shell">
          <div className="auth-card">
            <span className="eyebrow"><span />ACCOUNT RECOVERY</span>
            <h1>Forgot your password?</h1>
            <p className="auth-copy">
              Enter the email address for your SkillBridge account and we&apos;ll send you a secure password reset link.
            </p>

            {status === "sent" ? (
              <div className="auth-success" role="status">
                <span className="enquiry-tick" aria-hidden="true">✓</span>
                <h2>Check your email</h2>
                <p>
                  If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                  Please check your inbox and spam folder.
                </p>
                <Link href="/login" className="button button-primary">Back to sign in</Link>
              </div>
            ) : (
              <form className="school-form auth-form" onSubmit={onSubmit}>
                <div className="form-field form-field-wide">
                  <label htmlFor="forgot-email">Email address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={200}
                    placeholder="you@example.com"
                  />
                </div>

                {status === "error" ? (
                  <p className="form-note form-note-error form-field-wide" role="alert">{error}</p>
                ) : null}

                <div className="form-field-wide auth-actions">
                  <button type="submit" className="button button-primary" disabled={status === "sending"}>
                    {status === "sending" ? "Sending reset link…" : "Send reset link"}
                  </button>
                  <Link href="/login" className="text-link">Back to sign in</Link>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
