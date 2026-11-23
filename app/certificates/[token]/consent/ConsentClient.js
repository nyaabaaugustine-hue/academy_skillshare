"use client";

import { useState } from "react";
import Link from "next/link";

export default function ConsentClient({ token, award }) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [done, setDone] = useState(award?.consentVerified ? "approved" : award?.consentRespondedAt ? "declined" : "");

  async function respond(decision) {
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/awards/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not record consent.");
      setDone(decision);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record consent.");
    } finally {
      setStatus("idle");
    }
  }

  if (done) {
    return (
      <div className="showcase-empty">
        <h3>{done === "approved" ? "Consent recorded" : "Response recorded"}</h3>
        <p>
          {done === "approved"
            ? "Thank you. The certificate is now public and shareable."
            : "Thank you. The certificate will remain private."}
        </p>
        <Link className="button button-primary button-small" href={`/certificates/${token}`}>View certificate <span className="arrow">→</span></Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
      <p className="admin-muted" style={{ fontSize: 13, margin: 0 }}>
        Learner: <b>{award.learner}</b> · Award: <b>{award.title}</b>
        {award.milestone ? <> · Milestone: <b>{award.milestone}</b></> : null}
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>
        Only the learner’s first name or alias, award title, and milestone are shown on the public certificate page. No email, phone, or school contact details are published.
      </p>
      <label className="admin-field"><span>Optional note</span>
        <textarea className="admin-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </label>
      {error ? <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p> : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="admin-button admin-button-primary" onClick={() => respond("approve")} disabled={status === "sending"}>
          {status === "sending" ? "Saving…" : "I consent (publish)"}
        </button>
        <button type="button" className="admin-button admin-button-danger" onClick={() => respond("decline")} disabled={status === "sending"}>
          I do not consent
        </button>
      </div>
    </div>
  );
}
