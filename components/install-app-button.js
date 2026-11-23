"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getStandalone() {
  if (typeof window === "undefined") return false;
  return !!(window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone);
}

function getIosInstallable() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) && !getStandalone();
}

export default function InstallAppButton({ className = "button button-outline button-small", label = "Install app" }) {
  const router = useRouter();
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(getStandalone);
  const [ios] = useState(getIosInstallable);

  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault();
      setDeferred(e);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function onClick() {
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch {}
      setDeferred(null);
      return;
    }
    if (ios) {
      alert("To install on iPhone/iPad: tap Share, then 'Add to Home Screen'.");
      return;
    }
    router.push("/app/index.html?v=2");
  }

  if (installed) return null;

  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  );
}
