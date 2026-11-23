"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sb-python-playground-v1";
const DEFAULT_CODE = `# SkillBridge Python Playground
# Write Python code and click Run.

name = "SkillBridge learner"
skills = ["Python", "problem solving", "creativity"]

print(f"Hello, {name}!")
for i, skill in enumerate(skills, start=1):
    print(f"{i}. {skill}")
`;

const TEMPLATES = [
  { id: "hello", label: "Hello World", code: DEFAULT_CODE },
  { id: "loops", label: "Loops", code: `for i in range(1, 6):\n    print("Step", i)\n\ncount = 3\nwhile count > 0:\n    print("Countdown", count)\n    count -= 1\nprint("Go!")\n` },
  { id: "functions", label: "Functions", code: `def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Ama"))\nprint(greet("Kojo"))\n\n# Try changing the function or adding your own.\n` },
  { id: "lists", label: "Lists & Dicts", code: `students = [\n    {"name": "Ama", "score": 88},\n    {"name": "Kojo", "score": 92},\n    {"name": "Esi", "score": 79},\n]\n\nfor s in students:\n    print(s["name"], "->", s["score"])\n\navg = sum(s["score"] for s in students) / len(students)\nprint("Average:", avg)\n` },
  { id: "errors", label: "Debug Practice", code: `# This code has a bug. Can you fix it?\nnumbers = [1, 2, 3, 4, 5]\ntotal = 0\nfor n in numbers:\n    total = total + n\nprint("Total:", total)\n# Try changing numbers or introducing a bug to see the traceback.\n` },
];

function download(filename, text) {
  const blob = new Blob([text], { type: "text/x-python;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PlaygroundClient() {
  const [code, setCode] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_CODE;
    try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_CODE; } catch { return DEFAULT_CODE; }
  });
  const [status, setStatus] = useState("Loading Python runtime...");
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [traceback, setTraceback] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const workerRef = useRef(null);
  const runIdRef = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
  }, [code]);

  function killWorker() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setReady(false);
  }

  function ensureWorker() {
    if (workerRef.current) return workerRef.current;
    const w = new Worker("/playground/pyodide-worker.js");
    workerRef.current = w;
    w.onmessage = (e) => {
      const { id, type, result, error } = e.data || {};
      if (id !== runIdRef.current) return;
      if (type === "ready") {
        setReady(true);
        setStatus("Python ready.");
        return;
      }
      if (type === "result") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        setRunning(false);
        setStatus(result?.ok ? "Run completed." : "Run failed.");
        setStdout(result?.stdout || "");
        setStderr(result?.stderr || "");
        setTraceback(result?.traceback || "");
        return;
      }
      if (type === "error") {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        setRunning(false);
        setStatus("Runtime error.");
        setStderr(String(error || "Unknown error"));
      }
    };
    w.onerror = (err) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setRunning(false);
      setStatus("Worker error.");
      setStderr(String(err?.message || "Worker failed"));
      killWorker();
    };
    return w;
  }

  useEffect(() => {
    const w = ensureWorker();
    const id = ++runIdRef.current;
    w.postMessage({ id, type: "init" });
    return () => killWorker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runCode() {
    setRunning(true);
    setStatus("Running...");
    setStdout("");
    setStderr("");
    setTraceback("");
    const w = ensureWorker();
    if (!ready) {
      const initId = ++runIdRef.current;
      w.postMessage({ id: initId, type: "init" });
      await new Promise((r) => setTimeout(r, 100));
    }
    const id = ++runIdRef.current;
    w.postMessage({ id, type: "run", code });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      killWorker();
      setRunning(false);
      setStatus("Stopped (timeout after 10s).");
      setStderr("Execution timed out. Check for infinite loops or heavy computation.");
    }, 10000);
  }

  function stopRun() {
    killWorker();
    setRunning(false);
    setStatus("Stopped.");
  }

  async function askAppRobot() {
    const message = traceback || stderr || `Help me improve or explain this Python code:\n\`\`\`python\n${code}\n\`\`\``;
    setAiLoading(true);
    setAiError("");
    setAiResult("");
    try {
      const res = await fetch("/api/tutor/v1/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          message,
          mode: traceback || stderr ? "debug" : "explain",
          history: [],
          studentContext: { name: "Learner", role: "student" },
          teachingStyle: "clear",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "App Robot unavailable");
      setAiResult(typeof data?.text === "string" ? data.text : JSON.stringify(data ?? {}, null, 2));
      setStatus("App Robot responded.");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "App Robot unavailable.");
      setStatus("App Robot error.");
    } finally {
      setAiLoading(false);
    }
  }

  const output = [stdout, stderr, traceback].filter(Boolean).join("\n");
  const hasError = Boolean(stderr || traceback);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button className="button button-primary button-small" type="button" onClick={runCode} disabled={running}>{running ? "Running..." : "Run"}</button>
        <button className="button button-outline button-small" type="button" onClick={stopRun} disabled={!running}>Stop</button>
        <button className="button button-outline button-small" type="button" onClick={() => { setStdout(""); setStderr(""); setTraceback(""); setStatus("Output cleared."); }}>Clear output</button>
        <button className="button button-outline button-small" type="button" onClick={() => download("skillbridge-playground.py", code)}>Download .py</button>
        <button
          className={`button ${aiLoading ? "button-outline" : "button-primary"} button-small`}
          type="button"
          onClick={askAppRobot}
          disabled={aiLoading || !code.trim()}
        >
          {aiLoading ? "Asking App Robot…" : hasError ? "Ask App Robot to fix" : "Ask App Robot to explain"}
        </button>
        <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <span className="admin-muted" style={{ fontSize: 12 }}>Template</span>
          <select className="admin-input" style={{ width: 180 }} defaultValue="" onChange={(e) => {
            const t = TEMPLATES.find((x) => x.id === e.target.value);
            if (t) { setCode(t.code); setStatus(`Loaded template: ${t.label}`); }
            e.target.value = "";
          }}>
            <option value="">Choose...</option>
            {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <span className="admin-muted" style={{ fontSize: 12, marginLeft: "auto" }}>{status}</span>
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Editor</span>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            style={{ width: "100%", minHeight: 420, resize: "vertical", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.28)", color: "#e5e7eb", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 14, lineHeight: 1.6 }}
            aria-label="Python code editor"
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Output</span>
          <pre style={{ width: "100%", minHeight: 420, margin: 0, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.28)", color: "#d1fae5", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "auto" }}>{output || "Run your code to see output here."}</pre>
        </label>
      </div>

      {aiResult || aiError ? (
        <section style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 16, background: "rgba(0,0,0,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 12 }}>App Robot</span>
            {aiLoading && <span className="admin-muted" style={{ fontSize: 11, marginLeft: "auto" }}>Thinking…</span>}
          </div>
          {aiError && <p style={{ color: "#f87171", fontSize: 13, margin: 0, marginBottom: 8 }}>{aiError}</p>}
          {aiResult && <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 13, lineHeight: 1.6, color: "#e5e7eb", margin: 0, overflow: "auto" }}>{aiResult}</pre>}
        </section>
      ) : null}

      <div className="admin-muted" style={{ fontSize: 12 }}>
        Runs locally in your browser with Pyodide. No server execution. `input()` and some system/network features are limited in browser Python. Execution stops after 10 seconds. App Robot help is sent to the AI tutor proxy (server-side).
      </div>
    </div>
  );
}
