"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { authClient } from "../../lib/auth/client";

export default function AccountClient() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [prefs, setPrefs] = useState({ tutor_mode: "explain", reading_level: "standard", language: "en", reminders: false });
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account", { cache: "no-store", credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          setAccount(data?.user ?? null);
          setName(data?.user?.name ?? "");
        }
      } catch {
        setError("Could not load your account.");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!account) return;
    (async () => {
      try {
        const res = await fetch("/api/account/preferences", { cache: "no-store", credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.preferences) setPrefs(data.preferences);
      } catch {
        // Preferences are optional.
      } finally {
        setPrefsLoaded(true);
      }
    })();
  }, [account]);

  async function updateProfile(event) {
    event.preventDefault();
    setStatus("saving");
    setError("");
    setSuccess("");
    try {
      const { error: updateError } = await authClient.updateUser({ name: name.trim() });
      if (updateError) throw new Error(updateError.message);
      setSuccess("Profile updated.");
      const res = await fetch("/api/account", { cache: "no-store", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setAccount(data?.user ?? account);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setStatus("idle");
    }
  }

  async function resendVerification() {
    if (!account?.email) return;
    setStatus("verifying");
    setError("");
    setSuccess("");
    try {
      const { error: sendError } = await authClient.sendVerificationEmail({ email: account.email });
      if (sendError) throw new Error(sendError.message);
      setSuccess("Verification email sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send verification email.");
    } finally {
      setStatus("idle");
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setStatus("password");
    setError("");
    setSuccess("");
    try {
      const { error: pwError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (pwError) throw new Error(pwError.message);
      setSuccess("Password changed. Other sessions were signed out.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setStatus("idle");
    }
  }

  async function loadSessions() {
    setSessionsLoading(true);
    setError("");
    try {
      const result = await authClient.listSessions?.();
      const list = Array.isArray(result?.data) ? result.data : Array.isArray(result?.data?.sessions) ? result.data.sessions : [];
      setSessions(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sessions.");
    } finally {
      setSessionsLoading(false);
    }
  }

  async function revokeSession(session) {
    const token = session?.token || session?.sessionToken || session?.id;
    if (!token) return;
    try {
      await authClient.revokeSession?.({ token });
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke session.");
    }
  }

  async function revokeOtherSessions() {
    try {
      await authClient.revokeOtherSessions?.();
      await loadSessions();
      setSuccess("Other sessions signed out.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke sessions.");
    }
  }

  async function savePreferences(event) {
    event.preventDefault();
    setStatus("prefs");
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/account/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(prefs),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not save preferences.");
      setPrefs(data.preferences || prefs);
      setSuccess("Preferences saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preferences.");
    } finally {
      setStatus("idle");
    }
  }

  async function signOut() {
    try {
      await authClient.signOut();
      router.push("/");
    } catch {
      router.push("/");
    }
  }

  if (!loaded) {
    return <p className="admin-muted">Loading your account…</p>;
  }

  if (!account) {
    return (
      <div className="admin-panel">
        <h2>You are not signed in</h2>
        <p className="admin-muted">Sign in or create an account to manage your profile, preferences, and sessions.</p>
        <div className="hero-actions" style={{ marginTop: 12, gap: 10, flexWrap: "wrap" }}>
          <Link className="button button-primary button-small" href="/login">Sign in <span className="arrow">→</span></Link>
          <Link className="button button-outline button-small" href="/register">Create account <span className="arrow">→</span></Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {error ? <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p> : null}
      {success ? <p style={{ color: "#10b981", fontSize: 13, margin: 0 }}>{success}</p> : null}

      <section className="admin-panel">
        <h2>Profile</h2>
        <form onSubmit={updateProfile} className="admin-form" style={{ display: "grid", gap: 10 }}>
          <label className="admin-field"><span>Name</span>
            <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </label>
          <label className="admin-field"><span>Email</span>
            <input className="admin-input" value={account.email || ""} disabled />
          </label>
          <div className="admin-muted" style={{ fontSize: 12 }}>
            Email verified: {account.emailVerified ? "Yes" : "No"}
            {!account.emailVerified ? (
              <button type="button" className="admin-button admin-button-quiet" style={{ marginLeft: 8 }} onClick={resendVerification} disabled={status === "verifying"}>
                {status === "verifying" ? "Sending…" : "Resend verification"}
              </button>
            ) : null}
          </div>
          <button type="submit" className="admin-button admin-button-primary" disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Learning preferences</h2>
        <form onSubmit={savePreferences} className="admin-form" style={{ display: "grid", gap: 10 }}>
          <label className="admin-field"><span>Default tutor mode</span>
            <select className="admin-input" value={prefs.tutor_mode} onChange={(e) => setPrefs({ ...prefs, tutor_mode: e.target.value })}>
              {["explain", "debug", "quiz", "plan", "review", "project", "git", "functional", "stacktrace", "security", "architecture", "testing", "refactor"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="admin-field"><span>Reading level</span>
            <select className="admin-input" value={prefs.reading_level} onChange={(e) => setPrefs({ ...prefs, reading_level: e.target.value })}>
              <option value="simple">Simple</option>
              <option value="standard">Standard</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="admin-check">
            <input type="checkbox" checked={prefs.reminders} onChange={(e) => setPrefs({ ...prefs, reminders: e.target.checked })} />
            <span>Send gentle learning reminders</span>
          </label>
          <button type="submit" className="admin-button admin-button-primary" disabled={status === "prefs" || !prefsLoaded}>
            {status === "prefs" ? "Saving…" : "Save preferences"}
          </button>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Security</h2>
        <form onSubmit={changePassword} className="admin-form" style={{ display: "grid", gap: 10 }}>
          <label className="admin-field"><span>Current password</span>
            <input className="admin-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </label>
          <label className="admin-field"><span>New password</span>
            <input className="admin-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={12} />
          </label>
          <button type="submit" className="admin-button admin-button-primary" disabled={status === "password"}>
            {status === "password" ? "Changing…" : "Change password"}
          </button>
        </form>
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="admin-button admin-button-quiet" onClick={loadSessions} disabled={sessionsLoading}>
            {sessionsLoading ? "Loading…" : "Load active sessions"}
          </button>
          <button type="button" className="admin-button admin-button-quiet" onClick={revokeOtherSessions}>
            Sign out other sessions
          </button>
        </div>
        {sessions.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 8 }}>
            {sessions.map((s, idx) => (
              <li key={s?.token || s?.id || idx} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 10, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s?.ipAddress || "Unknown location"}</div>
                  <div className="admin-muted" style={{ fontSize: 11 }}>{s?.userAgent || "Unknown device"}{s?.createdAt ? ` · ${new Date(s.createdAt).toLocaleString()}` : ""}</div>
                </div>
                <button type="button" className="admin-button admin-button-danger" onClick={() => revokeSession(s)}>
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="admin-panel">
        <h2>Account actions</h2>
        <div className="hero-actions" style={{ gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="admin-button admin-button-danger" onClick={signOut}>Sign out</button>
          <Link className="admin-button admin-button-quiet" href="/settings">App settings</Link>
        </div>
      </section>
    </div>
  );
}
