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

export default function AiFloatingButton() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  const prompt = useMemo(() => PROMPTS[idx % PROMPTS.length], [idx]);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 1800);
    const rotate = setInterval(() => {
      setIdx((i) => (i + 1) % PROMPTS.length);
      setVisible(true);
    }, 12000);
    return () => { clearTimeout(show); clearInterval(rotate); };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const hide = setTimeout(() => setVisible(false), 6500);
    return () => clearTimeout(hide);
  }, [visible, idx]);

  return (
    <div className="ai-fab-wrap" aria-live="polite">
      <div className={`ai-fab-bubble ${visible || open ? "is-visible" : ""}`} role="status">
        <span className="ai-fab-bubble-type">{prompt.type === "quiz" ? "Quiz" : "Reminder"}</span>
        <p>{prompt.text}</p>
        <a href={HREF} className="ai-fab-bubble-cta">{prompt.type === "quiz" ? "Answer with AI" : "Open AI Tutor"}</a>
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
