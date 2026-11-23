"use client";

import { useEffect, useState } from "react";

const LOGO_URL =
  "https://res.cloudinary.com/z43ds8bn/image/upload/v1795486090/WhatsApp_Image_2026-11-16_at_7.25.58_AM.png";

export default function PremiumLoader() {
  const [phase, setPhase] = useState("hidden"); // hidden | visible | leaving

  useEffect(() => {
    const show = setTimeout(() => setPhase("visible"), 60);
    const hide = setTimeout(() => setPhase("leaving"), 1500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`premium-loader ${phase === "visible" ? "is-visible" : "is-leaving"}`}
      role="status"
      aria-label="Loading SkillBridge"
    >
      <div className="premium-loader__panel">
        <div className="premium-loader__glow" aria-hidden="true" />
        <div className="premium-loader__ring" aria-hidden="true" />
        <img className="premium-loader__logo" src={LOGO_URL} alt="SkillBridge" />
        <div className="premium-loader__text">SkillBridge</div>
        <div className="premium-loader__tagline">LEARN TODAY. INNOVATE TOMORROW.</div>
      </div>
      <div className="premium-loader__bar" aria-hidden="true" />
    </div>
  );
}
