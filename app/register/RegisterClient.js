"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerAccount, verifyEmailAddress, resendEmailVerification, sendPendingGuardianInvite } from "../../lib/web-auth";

const steps = ["Account", "Guardian", "Verify"];

export default function RegisterClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function nextToGuardian(event) {
    event.preventDefault();
    if (name.trim().length < 2) { setError("Enter your name."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (password.length < 12) { setError("Use at least 12 characters for your password."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setStep(1);
  }

  async function submitGuardian(event) {
    event.preventDefault();
    if (!guardianEmail.includes("@")) { setError("Enter a valid guardian email."); return; }
    if (guardianEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
      setError("Use a different email for the learner and guardian.");
      return;
    }
    setError("");
    setStep(0); // back to account submit? We'll instead submit now
    // Actually submit full registration here:
    setStatus("sending");
    try {
      const result = await registerAccount({ name, email, password, guardianEmail });
      setInfo(result.needsEmailConfirmation ? "We sent a 6-digit code to your email." : "Account created.");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
      setStep(1);
    } finally {
      setStatus("idle");
    }
  }

  async function verify(event) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) { setError("Enter the 6-digit code."); return; }
    setStatus("verifying");
    setError("");
    try {
      await verifyEmailAddress(email, code);
      try { await sendPendingGuardianInvite(); } catch { /* non-blocking */ }
      try { await fetch("/api/account/welcome", { method: "POST", credentials: "include" }); } catch {}
      setInfo("Email verified. Redirecting…");
      setTimeout(() => router.push("/account"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setStatus("idle");
    }
  }

  async function resend() {
    setStatus("resending");
    setError("");
    try {
      await resendEmailVerification(email);
      setInfo("A new code was sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="admin-panel" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {steps.map((label, idx) => (
          <span key={label} className={`admin-pill ${step === idx ? "admin-pill-new" : ""}`} style={{ opacity: step >= idx ? 1 : 0.5 }}>
            {idx + 1}. {label}
          </span>
        ))}
      </div>

      {error ? <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 10px" }}>{error}</p> : null}
      {info ? <p style={{ color: "#10b981", fontSize: 13, margin: "0 0 10px" }}>{info}</p> : null}

      {step === 0 ? (
        <form onSubmit={nextToGuardian} style={{ display: "grid", gap: 10 }}>
          <h2>Create your account</h2>
          <label className="admin-field"><span>Name</span>
            <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} />
          </label>
          <label className="admin-field"><span>Email</span>
            <input className="admin-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
          </label>
          <label className="admin-field"><span>Password</span>
            <input className="admin-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} />
          </label>
          <label className="admin-field"><span>Confirm password</span>
            <input className="admin-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={12} />
          </label>
          <button type="submit" className="admin-button admin-button-primary">Continue</button>
          <p className="admin-muted" style={{ fontSize: 12, margin: 0 }}>
            Already have an account? <Link href="/login" className="admin-link">Sign in</Link>
          </p>
        </form>
      ) : null}

      {step === 1 ? (
        <form onSubmit={submitGuardian} style={{ display: "grid", gap: 10 }}>
          <h2>Parent / Guardian email</h2>
          <p className="admin-muted" style={{ fontSize: 13, margin: 0 }}>
            We use this to send a family invitation so a parent or guardian can follow your progress.
          </p>
          <label className="admin-field"><span>Guardian email</span>
            <input className="admin-input" type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} required maxLength={200} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="admin-button admin-button-quiet" onClick={() => setStep(0)}>Back</button>
            <button type="submit" className="admin-button admin-button-primary" disabled={status === "sending"}>
              {status === "sending" ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form onSubmit={verify} style={{ display: "grid", gap: 10 }}>
          <h2>Verify your email</h2>
          <p className="admin-muted" style={{ fontSize: 13, margin: 0 }}>
            Enter the 6-digit code sent to {email}.
          </p>
          <label className="admin-field"><span>Verification code</span>
            <input className="admin-input" inputMode="numeric" pattern="\d{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="submit" className="admin-button admin-button-primary" disabled={status === "verifying"}>
              {status === "verifying" ? "Verifying…" : "Verify email"}
            </button>
            <button type="button" className="admin-button admin-button-quiet" onClick={resend} disabled={status === "resending"}>
              {status === "resending" ? "Sending…" : "Resend code"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
