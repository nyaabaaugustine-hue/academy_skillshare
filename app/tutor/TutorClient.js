"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { AI_TUTOR_MODES } from "../../lib/ai-tutor-capabilities";
import { authClient } from "../../lib/auth/client";

const modes = Object.entries(AI_TUTOR_MODES).map(([key, mode]) => ({ key, label: mode.label }));

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function TutorClient() {
  const [account, setAccount] = useState(null);
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [mode, setMode] = useState("explain");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("chat");
  const [history, setHistory] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account", { cache: "no-store", credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data?.user) setAccount(data.user);
      } catch {
        // Anonymous tutor use is allowed.
      } finally {
        if (!cancelled) setAccountLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function getToken() {
    try {
      const result = await authClient.getAccessToken?.();
      return result?.data?.token || result?.data?.accessToken || null;
    } catch {
      return null;
    }
  }

  async function saveTurn(role, message, turnMode) {
    if (!account) return null;
    try {
      const res = await fetch("/api/tutor/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role, message, mode: turnMode }),
      });
      const data = await res.json().catch(() => ({}));
      return data?.history?.id ?? null;
    } catch {
      return null;
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError("");
    setInput("");
    const userMsg = { id: uid(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const historyPayload = messages.slice(-12).map((m) => ({ role: m.role, content: m.text }));
    try {
      const token = await getToken();
      const headers = { "Content-Type": "application/json", Accept: "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch("/api/tutor/v1/tutor/chat", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          message: text,
          mode,
          history: historyPayload,
          studentContext: account ? { name: account.name, role: "student" } : { name: "Guest", role: "student" },
          teachingStyle: "clear",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || "App Robot is unavailable");

      const reply = typeof data?.text === "string" ? data.text : typeof data?.response === "string" ? data.response : JSON.stringify(data ?? {}, null, 2);
      const assistantId = uid();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", text: reply, historyId: null }]);

      if (account) {
        const userHistoryId = await saveTurn("user", text, mode);
        const assistantHistoryId = await saveTurn("assistant", reply, mode);
        if (assistantHistoryId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, historyId: assistantHistoryId } : m)),
          );
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "App Robot is unavailable");
      setMessages((prev) => [...prev, { id: uid(), role: "assistant", text: "Sorry, I could not respond right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    if (!account) return;
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/tutor/history", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setHistory(Array.isArray(data.history) ? data.history : []);
    } catch {
      setError("Could not load history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadBookmarks() {
    if (!account) return;
    setBookmarkLoading(true);
    try {
      const res = await fetch("/api/tutor/bookmarks", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setBookmarks(Array.isArray(data.bookmarks) ? data.bookmarks : []);
    } catch {
      setError("Could not load bookmarks.");
    } finally {
      setBookmarkLoading(false);
    }
  }

  function switchTab(next) {
    setTab(next);
    if (next === "history") loadHistory();
    if (next === "bookmarks") loadBookmarks();
  }

  async function bookmarkMessage(message) {
    if (!account || !message.historyId) {
      setError("Sign in and send a message before bookmarking.");
      return;
    }
    try {
      const res = await fetch("/api/tutor/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ history_id: message.historyId, title: message.text.slice(0, 80) }),
      });
      if (!res.ok) throw new Error("Could not bookmark.");
      await loadBookmarks();
      setTab("bookmarks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not bookmark.");
    }
  }

  async function removeBookmark(id) {
    try {
      await fetch(`/api/tutor/bookmarks?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
      await loadBookmarks();
    } catch {
      setError("Could not remove bookmark.");
    }
  }

  async function deleteHistory(id) {
    try {
      await fetch(`/api/tutor/history?id=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
      await loadHistory();
    } catch {
      setError("Could not delete history.");
    }
  }

  function loadConversationFromHistory() {
    const ordered = [...history].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    setMessages(ordered.map((h) => ({ id: String(h.id), role: h.role, text: h.message, historyId: h.id })));
    setTab("chat");
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {["chat", "history", "bookmarks"].map((t) => (
          <button
            key={t}
            type="button"
            className={`button ${tab === t ? "button-primary" : "button-outline"} button-small`}
            onClick={() => switchTab(t)}
          >
            {t === "chat" ? "Chat" : t === "history" ? "History" : "Bookmarks"}
          </button>
        ))}
        <span className="admin-muted" style={{ marginLeft: "auto", fontSize: 12 }}>
          {accountLoaded ? (account ? `Signed in as ${account.name}` : "Anonymous (sign in to save history)") : "Checking account..."}
        </span>
        {!account && accountLoaded ? (
          <Link className="button button-glass button-small" href="/login">Sign in <span className="arrow">→</span></Link>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            className={`button ${mode === m.key ? "button-primary" : "button-outline"} button-small`}
            onClick={() => setMode(m.key)}
            style={{ fontSize: 12 }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {tab === "chat" ? (
        <>
          <div
            ref={scrollRef}
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 16,
              minHeight: 360,
              maxHeight: 520,
              overflow: "auto",
              background: "rgba(0,0,0,0.18)",
            }}
          >
            {messages.length === 0 ? (
              <p className="admin-muted" style={{ margin: 0 }}>Ask App Robot anything about coding, debugging, quizzes, or study plans.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: m.role === "user" ? "#5eead4" : "#a5b4fc", marginBottom: 4 }}>
                    {m.role === "user" ? "You" : "App Robot"}
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontSize: 13, lineHeight: 1.6, color: "#e5e7eb" }}>{m.text}</pre>
                  {m.role === "assistant" && account && m.historyId ? (
                    <button
                      type="button"
                      className="admin-button admin-button-quiet"
                      style={{ marginTop: 6, fontSize: 11 }}
                      onClick={() => bookmarkMessage(m)}
                    >
                      Bookmark
                    </button>
                  ) : null}
                </div>
              ))
            )}
            {loading ? <p className="admin-muted" style={{ margin: 0 }}>App Robot is thinking…</p> : null}
          </div>

          {error ? <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p> : null}

          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask App Robot... (Ctrl/Cmd+Enter to send)"
              rows={3}
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.28)", color: "#e5e7eb", fontFamily: "inherit", fontSize: 14, resize: "vertical" }}
            />
            <button
              type="button"
              className="button button-primary"
              onClick={send}
              disabled={loading || !input.trim()}
              style={{ alignSelf: "flex-end" }}
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </div>
        </>
      ) : null}

      {tab === "history" ? (
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 16, background: "rgba(0,0,0,0.18)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <button type="button" className="button button-outline button-small" onClick={loadHistory} disabled={historyLoading}>
              {historyLoading ? "Loading…" : "Refresh"}
            </button>
            {history.length > 0 ? (
              <button type="button" className="button button-primary button-small" onClick={loadConversationFromHistory}>
                Load conversation into chat
              </button>
            ) : null}
          </div>
          {!account ? (
            <p className="admin-muted">Sign in to view saved history.</p>
          ) : historyLoading ? (
            <p className="admin-muted">Loading history…</p>
          ) : history.length === 0 ? (
            <p className="admin-muted">No saved history yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {history.map((h) => (
                <li key={h.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 11, color: h.role === "user" ? "#5eead4" : "#a5b4fc", fontWeight: 700, marginBottom: 4 }}>
                    {h.role} · {h.mode || "explain"} · {new Date(h.created_at).toLocaleString()}
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontSize: 12, color: "#e5e7eb" }}>{String(h.message).slice(0, 400)}</pre>
                  <button
                    type="button"
                    className="admin-button admin-button-danger"
                    style={{ marginTop: 6, fontSize: 11 }}
                    onClick={() => deleteHistory(h.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "bookmarks" ? (
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 16, background: "rgba(0,0,0,0.18)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button type="button" className="button button-outline button-small" onClick={loadBookmarks} disabled={bookmarkLoading}>
              {bookmarkLoading ? "Loading…" : "Refresh"}
            </button>
          </div>
          {!account ? (
            <p className="admin-muted">Sign in to view bookmarks.</p>
          ) : bookmarkLoading ? (
            <p className="admin-muted">Loading bookmarks…</p>
          ) : bookmarks.length === 0 ? (
            <p className="admin-muted">No bookmarks yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {bookmarks.map((b) => (
                <li key={b.id} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 700, marginBottom: 4 }}>
                    {b.title || "Bookmark"} · {new Date(b.created_at).toLocaleString()}
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, fontSize: 12, color: "#e5e7eb" }}>{String(b.message).slice(0, 600)}</pre>
                  <button
                    type="button"
                    className="admin-button admin-button-danger"
                    style={{ marginTop: 6, fontSize: 11 }}
                    onClick={() => removeBookmark(b.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
