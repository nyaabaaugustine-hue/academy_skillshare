"use client";

import { useEffect, useMemo, useState } from "react";

const IMG = "https://res.cloudinary.com/ea91sdts/image/upload/v1795290743/robot_ai_button_tight_transparent.png";
const HREF = "/app/index.html?v=2#/ai-tutor";

const PROMPTS = [
  { type: "reminder", text: "Ready to learn? Your AI tutor is here." },
  { type: "quiz", text: "Quick quiz: What does HTML stand for?" },
  { type: "reminder", text: "Keep your streak going — 5 minutes today!" },
  { type: "quiz", text: "Quick quiz: What keyword declares a variable in JavaScript?" },
  { type: "reminder", text: "Need help? Ask the AI tutor anything." },
  { type: "quiz", text: "Quick quiz: What does CSS control on a webpage?" },
];

const QUICK_ACTIONS = [
  { label: "Explain", href: `${HREF}?mode=explain` },
  { label: "Debug", href: `${HREF}?mode=debug` },
  { label: "Quiz", href: `${HREF}?mode=quiz` },
  { label: "Plan", href: `${HREF}?mode=plan` },
];

const DISMISS_KEY = "sb-ai-fab-bubble-dismissed";

export default function AiFloatingButton() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const prompt = useMemo(() => PROMPTS[idx % PROMPTS.length], [idx]);

  useEffect(() => {
    if (dismissed) return;
    let cancelled = false;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") {
        const t = setTimeout(() => { if (!cancelled) setDismissed(true); }, 0);
        return () => { cancelled = true; clearTimeout(t); };
      }
    } catch {}
    const show = setTimeout(() => { if (!cancelled) setVisible(true); }, 1800);
    const rotate = setInterval(() => {
      if (cancelled) return;
      setIdx((i) => (i + 1) % PROMPTS.length);
      setVisible(true);
    }, 12000);
    return () => { cancelled = true; clearTimeout(show); clearInterval(rotate); };
  }, [dismissed]);

  useEffect(() => {
    if (!visible || dismissed) return;
    const hide = setTimeout(() => setVisible(false), 6500);
    return () => clearTimeout(hide);
  }, [visible, idx, dismissed]);

  function dismissBubble(e) {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    setVisible(false);
    setOpen(false);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
  }

  return (
    <div className="ai-fab-wrap" aria-live="polite">
      <div className={`ai-fab-bubble ${!dismissed && (visible || open) ? "is-visible" : ""}`} role="status">
        <button type="button" className="ai-fab-bubble-close" aria-label="Close AI tutor reminder" onClick={dismissBubble}>×</button>
        <span className="ai-fab-bubble-type">{prompt.type === "quiz" ? "Quiz" : "Reminder"}</span>
        <p>{prompt.text}</p>
        <a href={HREF} className="ai-fab-bubble-cta">{prompt.type === "quiz" ? "Answer with AI" : "Open AI Tutor"}</a>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {QUICK_ACTIONS.map((a) => (
            <a key={a.label} href={a.href} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.25)", textDecoration: "none", color: "inherit", background: "rgba(255,255,255,0.06)" }}>
              {a.label}
            </a>
          ))}
        </div>
      </div>

      <a
        href={HREF}
        className="ai-fab"
        aria-label="Open SkillBridge AI tutor"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <span className="ai-fab-ring" aria-hidden="true" />
        <span className="ai-fab-ring ai-fab-ring-delay" aria-hidden="true" />
        <span className="ai-fab-glow" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element -- small fixed external Cloudinary asset; next/image remote patterns not needed */}
        <img src={IMG} alt="" width="72" height="72" className="ai-fab-img" />
        <span className="ai-fab-badge" aria-hidden="true">AI</span>
      </a>
    </div>
  );
}
