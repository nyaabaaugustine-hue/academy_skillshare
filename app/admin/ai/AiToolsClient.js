"use client";

import { useMemo, useState } from "react";
import { AI_TOOL_CATEGORIES, AI_TOOLS } from "../../../lib/ai-tools-catalog";

const STATUS_LABEL = { available: "Available", beta: "Beta", planned: "Planned" };

const QUICK_PROMPTS = [
  "Summarize new enquiries needing attention and draft follow-up actions.",
  "Identify learners who may be at risk based on progress and activity records.",
  "Draft a parent/guardian progress update for a selected learner.",
  "Generate a weekly operations digest for the SkillBridge admin team.",
  "Check this content for clarity, safety, and age-appropriate tone.",
];

export default function AiToolsClient() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [selectedId, setSelectedId] = useState(AI_TOOLS[0]?.id || "");
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return AI_TOOLS.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (status !== "All" && t.status !== status) return false;
      if (!qq) return true;
      return `${t.name} ${t.description} ${t.category} ${t.id}`.toLowerCase().includes(qq);
    });
  }, [q, category, status]);

  const selected = AI_TOOLS.find((t) => t.id === selectedId) || filtered[0] || AI_TOOLS[0];

  async function runTool(e) {
    e.preventDefault();
    if (!selected) return;
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: selected.id, input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to run tool");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">Admin AI</p>
          <h1>AI tools</h1>
          <p className="admin-muted">
            {AI_TOOLS.length} registered tools. Admin AI runs have read-only access to student records
            (learners, progress, enquiries, LMS, leaderboard) via server-side DB context.
          </p>
        </div>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>
        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Catalog</h2>
            <p className="admin-muted">{filtered.length} shown</p>
          </div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 12 }}>
            <input className="admin-input" placeholder="Search tools..." value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="admin-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="All">All categories</option>
              {AI_TOOL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="admin-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="All">All statuses</option>
              <option value="available">Available</option>
              <option value="beta">Beta</option>
              <option value="planned">Planned</option>
            </select>
          </div>
          <div style={{ display: "grid", gap: 8, maxHeight: 640, overflow: "auto" }}>
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className="admin-panel"
                style={{
                  textAlign: "left", padding: 12, cursor: "pointer",
                  border: selected?.id === t.id ? "2px solid #0ea5a4" : "1px solid rgba(255,255,255,0.08)",
                  background: selected?.id === t.id ? "rgba(14,165,164,0.08)" : undefined,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <strong>{t.no}. {t.name}</strong>
                  <span className="admin-muted" style={{ fontSize: 12 }}>{STATUS_LABEL[t.status]}</span>
                </div>
                <div className="admin-muted" style={{ fontSize: 12 }}>{t.category}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{t.description}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <h2>Run tool</h2>
            {selected && <p className="admin-muted">{selected.name} — {STATUS_LABEL[selected.status]}</p>}
          </div>
          {selected && (
            <form onSubmit={runTool} style={{ display: "grid", gap: 12 }}>
              <div className="admin-muted" style={{ fontSize: 13 }}>{selected.description}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} type="button" className="admin-btn" style={{ fontSize: 11, padding: "6px 8px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)" }} onClick={() => setInput(p)}>
                    {p.length > 42 ? `${p.slice(0, 42)}...` : p}
                  </button>
                ))}
              </div>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Input / request</span>
                <textarea
                  className="admin-input"
                  rows={8}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`What should "${selected.name}" do? Include any context needed.`}
                  required
                />
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="admin-btn" type="submit" disabled={running}>{running ? "Running..." : "Run AI tool"}</button>
                <span className="admin-muted" style={{ fontSize: 12 }}>Admin-only. Student records may be included as read-only context.</span>
              </div>
            </form>
          )}
          {error && <p style={{ color: "#f87171", marginTop: 12 }}>{error}</p>}
          {result && (
            <div style={{ marginTop: 16 }}>
              <div className="admin-panel-header"><h3>Result</h3></div>
              {result.message && <p className="admin-muted" style={{ fontSize: 13 }}>{result.message}</p>}
              {result.recordsIncluded && (
                <p className="admin-muted" style={{ fontSize: 12 }}>Records included: {result.recordsIncluded.join(", ")}</p>
              )}
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8, maxHeight: 420, overflow: "auto" }}>
                {typeof result.result === "string" ? result.result : JSON.stringify(result.result ?? result, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
