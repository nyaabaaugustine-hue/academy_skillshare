"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import { loginAccount } from "../../lib/web-auth";
import { learnerAppUrl } from "../../lib/learner-app-url";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    try {
      await loginAccount(email, password);
      router.push(learnerAppUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in. Please try again.");
      setStatus("error");
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <section className="auth-shell">
          <div className="auth-card">
            <span className="eyebrow"><span />LEARNER SIGN IN</span>
            <h1>Welcome back</h1>
            <p className="auth-copy">
              Sign in to continue your learning journey with SkillBridge Academy.
            </p>
            <div className="auth-intro-video">
              <video
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="auto"
                poster=""
                aria-label="SkillBridge Academy introduction video"
              >
                <source src="/videos/skillbridge-intro.mp4" type="video/mp4" />
                <source src="https://res.cloudinary.com/dx1nrew3h/video/upload/v1794677999/nnnnewww_jl1qzc.mp4" type="video/mp4" />
              </video>
            </div>

            <form className="school-form auth-form" onSubmit={onSubmit}>
              <div className="form-field form-field-wide">
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={200}
                />
              </div>
              <div className="form-field form-field-wide">
                <div className="auth-label-row">
                  <label htmlFor="login-password">Password</label>
                  <Link href="/forgot-password" className="auth-inline-link">Forgot password?</Link>
                </div>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {status === "error" ? (
                <p className="form-note form-note-error form-field-wide" role="alert">{error}</p>
              ) : null}

              <div className="form-field-wide auth-actions">
                <button type="submit" className="button button-primary" disabled={status === "sending"}>
                  {status === "sending" ? "Signing in…" : "Sign in"}
                </button>
                <Link href="/forgot-password" className="text-link">Forgot password?</Link>
              </div>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
