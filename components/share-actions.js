"use client";

import { useState } from "react";

function buildUrl(platform, url, text) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  if (platform === "x") return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
  if (platform === "facebook") return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
  if (platform === "linkedin") return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
  if (platform === "whatsapp") return `https://wa.me/?text=${t}%20${u}`;
  return url;
}

export default function ShareActions({ url, text, title = "Share this", compact = false }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = text || "Check this out on SkillBridge Academy";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const items = [
    { id: "x", label: "X" },
    { id: "facebook", label: "Facebook" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "whatsapp", label: "WhatsApp" },
  ];

  return (
    <div className={`share-actions${compact ? " share-actions-compact" : ""}`} aria-label={title}>
      {!compact ? <span className="share-actions-label">{title}</span> : null}
      <div className="share-actions-buttons">
        {items.map((item) => (
          <a
            key={item.id}
            className="share-action-btn"
            href={buildUrl(item.id, shareUrl, shareText)}
            target="_blank"
            rel="noreferrer noopener"
          >
            {item.label}
          </a>
        ))}
        <button type="button" className="share-action-btn share-action-copy" onClick={copyLink}>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
