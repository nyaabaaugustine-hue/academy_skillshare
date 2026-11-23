"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotificationsClient() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/notifications", { cache: "no-store", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not load notifications.");
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setUnread(Number(data.unread || 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ all: true }),
      });
      await load();
    } catch {
      setError("Could not mark as read.");
    }
  }

  async function markRead(id) {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: [id] }),
      });
      await load();
    } catch {
      setError("Could not mark as read.");
    }
  }

  if (loading) return <p className="admin-muted">Loading notifications…</p>;

  return (
    <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span className="admin-muted" style={{ fontSize: 12 }}>{unread} unread</span>
        {unread > 0 ? (
          <button type="button" className="admin-button admin-button-quiet" onClick={markAllRead}>Mark all read</button>
        ) : null}
        <button type="button" className="admin-button admin-button-quiet" onClick={load}>Refresh</button>
      </div>
      {error ? <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p> : null}
      {items.length === 0 ? (
        <p className="admin-empty">No notifications yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          {items.map((n) => (
            <li key={n.id} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 12, background: n.read_at ? "rgba(255,255,255,0.02)" : "rgba(94,234,212,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#e5e7eb" }}>{n.title}</div>
                  {n.body ? <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{n.body}</p> : null}
                  <div className="admin-muted" style={{ fontSize: 10, marginTop: 6 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.read_at ? (
                  <button type="button" className="admin-button admin-button-quiet" style={{ fontSize: 11 }} onClick={() => markRead(n.id)}>Mark read</button>
                ) : null}
              </div>
              {n.link ? (
                <Link href={n.link} className="admin-link" style={{ fontSize: 12, marginTop: 6, display: "inline-block" }}>Open ↗</Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
