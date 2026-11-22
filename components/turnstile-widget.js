"use client";

import { useEffect, useRef } from "react";

/**
 * Renders the Cloudflare Turnstile widget only when a site key is configured.
 * The hidden input `cf-turnstile-response` is submitted with the form and
 * verified server-side.
 */
export default function TurnstileWidget({ siteKey, action = "form" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!siteKey || !ref.current) return undefined;
    const node = ref.current;

    const render = () => {
      if (!window.turnstile?.render || node.dataset.rendered === "1") return;
      window.turnstile.render(node, { sitekey: siteKey, action });
      node.dataset.rendered = "1";
    };

    if (window.turnstile?.render) {
      render();
      return undefined;
    }

    const existing = document.querySelector('script[data-turnstile="1"]');
    if (existing) {
      existing.addEventListener("load", render);
      return () => existing.removeEventListener("load", render);
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = "1";
    script.addEventListener("load", render);
    document.head.appendChild(script);
    return () => script.removeEventListener("load", render);
  }, [siteKey, action]);

  if (!siteKey) return null;
  return <div ref={ref} className="cf-turnstile" data-sitekey={siteKey} />;
}
