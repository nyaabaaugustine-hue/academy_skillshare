"use client";

import { useState } from "react";

export default function AnnouncementForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, audience: "all" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data?.error ? `Could not publish: ${data.error}` : "Could not publish.");
        return;
      }
      setTitle("");
      setBody("");
      setStatus(
        data.pushEnabled
          ? `Published. Push sent to ${data.sent} device${data.sent === 1 ? "" : "s"}.`
          : "Published to inboxes. Push is not configured on the server.",
      );
    } catch {
      setStatus("Could not publish. Check the server logs.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-panel">
      <h2>Write an announcement</h2>
      <form onSubmit={submit} className="admin-form">
        <label className="admin-field admin-field-wide">
          <span>Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={180}
          />
        </label>
        <label className="admin-field admin-field-wide">
          <span>Message</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            required
            maxLength={4000}
          />
        </label>
        <button type="submit" className="admin-button admin-button-primary" disabled={busy}>
          {busy ? "Publishing…" : "Publish announcement"}
        </button>
      </form>
      {status ? (
        <p className="admin-alert admin-alert-ok" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
