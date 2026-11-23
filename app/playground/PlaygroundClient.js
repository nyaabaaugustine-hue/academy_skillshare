"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sb-python-playground-v2";
const DEFAULT_CODE = `# SkillBridge Python Playground
# Write Python code and click Run.

name = "SkillBridge learner"
skills = ["Python", "problem solving", "creativity"]

print(f"Hello, {name}!")
for i, skill in enumerate(skills, start=1):
    print(f"{i}. {skill}")
`;

const CHALLENGES = [
  { id: "hello", title: "Hello, learner", description: "Print a friendly greeting with your name.", starter: `name = "Ama"\nprint(f"Hello, {name}!")\n`, expected: "Hello, Ama!" },
  { id: "sum", title: "Sum a list", description: "Print the sum of [1,2,3,4,5].", starter: `numbers = [1, 2, 3, 4, 5]\nprint(sum(numbers))\n`, expected: "15" },
  { id: "loop", title: "Countdown", description: "Print 3, 2, 1, Go! using a loop.", starter: `for n in range(3, 0, -1):\n    print(n)\nprint("Go!")\n`, expected: "Go!" },
  { id: "input", title: "Greet from input", description: "Read a name from input() and greet it. Try stdin: Ama", starter: `name = input("Name: ")\nprint(f"Hi, {name}!")\n`, stdin: "Ama", expected: "Hi, Ama!" },
  { id: "fizz", title: "FizzBuzz (1-20)", description: "Print Fizz/Buzz/FizzBuzz for 1..20.", starter: `for n in range(1, 21):\n    if n % 15 == 0:\n        print("FizzBuzz")\n    elif n % 3 == 0:\n        print("Fizz")\n    elif n % 5 == 0:\n        print("Buzz")\n    else:\n        print(n)\n`, expected: "FizzBuzz" },
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

function makeTab(name = "untitled.py", code = DEFAULT_CODE) {
  return { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, code };
}

function loadTabs() {
  if (typeof window === "undefined") return [makeTab("main.py", DEFAULT_CODE)];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  return [makeTab("main.py", DEFAULT_CODE)];
}

export default function PlaygroundClient() {
  const [tabs, setTabs] = useState(() => loadTabs());
  const [activeId, setActiveId] = useState(() => {
    const t = loadTabs();
    return t[0]?.id;
  });
  const [status, setStatus] = useState("Loading Python runtime...");
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [traceback, setTraceback] = useState("");
  const [stdin, setStdin] = useState("");
  const [expected, setExpected] = useState("");
  const [checkResult, setCheckResult] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [loadToken, setLoadToken] = useState("");
  const workerRef = useRef(null);
  const runIdRef = useRef(0);
  const timeoutRef = useRef(null);

  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs)); } catch {}
  }, [tabs]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("snippet");
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`/api/playground/snippets?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.snippet) {
          const tab = makeTab(data.snippet.title || "shared.py", data.snippet.code || DEFAULT_CODE);
          setTabs((prev) => [...prev, tab]);
          setActiveId(tab.id);
          setStdin(data.snippet.stdin || "");
          setStatus(`Loaded shared snippet: ${data.snippet.title}`);
        }
      } catch {
        setStatus("Could not load shared snippet.");
      }
    })();
  }, []);

  function updateActiveCode(value) {
    setTabs((prev) => prev.map((t) => (t.id === activeId ? { ...t, code: value } : t)));
  }

  function addTab() {
    const tab = makeTab("untitled.py", "");
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
    setStatus(`New tab: ${tab.name}`);
  }

  function closeTab(id) {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) return [makeTab("main.py", DEFAULT_CODE)];
      if (activeId === id) setActiveId(next[next.length - 1].id);
      return next;
    });
  }

  function renameTab(id) {
    const current = tabs.find((t) => t.id === id);
    const name = window.prompt("Tab name", current?.name || "untitled.py");
    if (!name) return;
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name: name.slice(0, 60) } : t)));
  }

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
    setCheckResult("");
    const w = ensureWorker();
    if (!ready) {
      const initId = ++runIdRef.current;
      w.postMessage({ id: initId, type: "init" });
      await new Promise((r) => setTimeout(r, 100));
    }
    const id = ++runIdRef.current;
    w.postMessage({ id, type: "run", code: activeTab?.code || "", stdin });
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

  function checkAnswer() {
    if (!expected) { setCheckResult("No expected output for this challenge."); return; }
    const ok = stdout.includes(expected);
    setCheckResult(ok ? "✅ Looks good!" : "❌ Output does not include expected result yet.");
  }

  async function askAppRobot() {
    const output = [stdout, stderr, traceback].filter(Boolean).join("\n");
    const message = traceback || stderr
      ? `Fix this Python code and explain the error.\n\`\`\`python\n${activeTab?.code || ""}\n\`\`\`\nOutput:\n${output}`
      : `Explain this Python code and suggest improvements.\n\`\`\`python\n${activeTab?.code || ""}\n\`\`\``;
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

  async function shareSnippet() {
    setShareLoading(true);
    setShareUrl("");
    try {
      const res = await fetch("/api/playground/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: activeTab?.name || "snippet.py", code: activeTab?.code || "", stdin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not share snippet.");
      const token = data?.snippet?.share_token;
      if (token) {
        const url = `${window.location.origin}/playground/s/${token}`;
        setShareUrl(url);
        try { await navigator.clipboard.writeText(url); } catch {}
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Could not share snippet.");
    } finally {
      setShareLoading(false);
    }
  }

  async function loadSharedSnippet() {
    const token = loadToken.trim();
    if (!token) return;
    try {
      const res = await fetch(`/api/playground/snippets?token=${encodeURIComponent(token)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Snippet not found.");
      const tab = makeTab(data.snippet.title || "shared.py", data.snippet.code || DEFAULT_CODE);
      setTabs((prev) => [...prev, tab]);
      setActiveId(tab.id);
      setStdin(data.snippet.stdin || "");
      setStatus(`Loaded shared snippet.`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Could not load snippet.");
    }
  }

  const output = [stdout, stderr, traceback].filter(Boolean).join("\n");
  const hasError = Boolean(stderr || traceback);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button className="button button-primary button-small" type="button" onClick={runCode} disabled={running}>{running ? "Running..." : "Run"}</button>
        <button className="button button-outline button-small" type="button" onClick={stopRun} disabled={!running}>Stop</button>
        <button className="button button-outline button-small" type="button" onClick={() => { setStdout(""); setStderr(""); setTraceback(""); setStatus("Output cleared."); setCheckResult(""); }}>Clear output</button>
        <button className="button button-outline button-small" type="button" onClick={() => download(activeTab?.name || "snippet.py", activeTab?.code || "")}>Download .py</button>
        <button className={`button ${aiLoading ? "button-outline" : "button-primary"} button-small`} type="button" onClick={askAppRobot} disabled={aiLoading || !activeTab?.code?.trim()}>
          {aiLoading ? "Asking App Robot…" : hasError ? "Ask App Robot to fix" : "Ask App Robot to explain"}
        </button>
        <button className="button button-outline button-small" type="button" onClick={shareSnippet} disabled={shareLoading || !activeTab?.code?.trim()}>
          {shareLoading ? "Sharing…" : "Share snippet"}
        </button>
        <span className="admin-muted" style={{ fontSize: 12, marginLeft: "auto" }}>{status}</span>
      </div>

      {shareUrl ? (
        <p style={{ fontSize: 12, margin: 0, color: "#5eead4", wordBreak: "break-all" }}>Share link (copied): {shareUrl}</p>
      ) : null}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)" }}>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {tabs.map((t) => (
              <div key={t.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 8, border: `1px solid ${t.id === activeId ? "rgba(94,234,212,0.6)" : "rgba(255,255,255,0.12)"}`, background: t.id === activeId ? "rgba(94,234,212,0.12)" : "rgba(0,0,0,0.18)" }}>
                <button type="button" onClick={() => setActiveId(t.id)} style={{ background: "transparent", border: "none", color: "#e5e7eb", cursor: "pointer", fontSize: 12, padding: 0 }}>{t.name}</button>
                <button type="button" onClick={() => renameTab(t.id)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 11, padding: 0 }} title="Rename">✎</button>
                <button type="button" onClick={() => closeTab(t.id)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 11, padding: 0 }} title="Close">×</button>
              </div>
            ))}
            <button type="button" className="button button-outline button-small" onClick={addTab}>+ Tab</button>
          </div>

          <textarea
            value={activeTab?.code || ""}
            onChange={(e) => updateActiveCode(e.target.value)}
            spellCheck={false}
            style={{ width: "100%", minHeight: 360, resize: "vertical", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.28)", color: "#e5e7eb", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 14, lineHeight: 1.6 }}
            aria-label="Python code editor"
          />

          <div style={{ display: "grid", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Standard input (stdin)</label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              rows={3}
              placeholder="Lines fed to input()"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.28)", color: "#e5e7eb", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 13 }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Output</label>
            <pre style={{ width: "100%", minHeight: 220, margin: "6px 0 0", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.28)", color: "#d1fae5", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "auto" }}>{output || "Run your code to see output here."}</pre>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.12)" }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Challenges</div>
            <select className="admin-input" style={{ width: "100%", marginBottom: 8 }} defaultValue="" onChange={(e) => {
              const c = CHALLENGES.find((x) => x.id === e.target.value);
              if (c) {
                const tab = makeTab(`${c.id}.py`, c.starter);
                setTabs((prev) => [...prev, tab]);
                setActiveId(tab.id);
                setStdin(c.stdin || "");
                setExpected(c.expected || "");
                setStatus(`Challenge: ${c.title}`);
              }
              e.target.value = "";
            }}>
              <option value="">Choose a challenge...</option>
              {CHALLENGES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {expected ? (
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <button type="button" className="button button-outline button-small" onClick={checkAnswer}>Check answer</button>
                {checkResult ? <span style={{ fontSize: 12 }}>{checkResult}</span> : null}
              </div>
            ) : null}
            <p className="admin-muted" style={{ fontSize: 11, marginTop: 6 }}>Expected output contains: {expected || "—"}</p>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.12)" }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8 }}>Load shared snippet</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="admin-input" style={{ flex: 1 }} value={loadToken} onChange={(e) => setLoadToken(e.target.value)} placeholder="Paste share token" />
              <button type="button" className="button button-outline button-small" onClick={loadSharedSnippet}>Load</button>
            </div>
          </div>
        </div>
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
        Runs locally in your browser with Pyodide. No server execution. <code>input()</code> is supported via the stdin box. Execution stops after 10 seconds. App Robot help and snippet sharing use the server-side proxy.
      </div>
    </div>
  );
}
