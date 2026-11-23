"use client";

import { useEffect } from "react";

export default function ImageProtection() {
  useEffect(() => {
    const preventDefault = (event) => {
      event.preventDefault();
      return false;
    };

    const onContextMenu = (event) => {
      const target = event.target;
      if (target && (target.tagName === "IMG" || target.closest?.("img, picture, figure"))) {
        event.preventDefault();
      }
    };

    const onDragStart = (event) => {
      const target = event.target;
      if (target && (target.tagName === "IMG" || target.closest?.("img, picture, figure"))) {
        event.preventDefault();
      }
    };

    const onKeyDown = (event) => {
      const key = (event.key || "").toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ["s", "u", "p", "a"].includes(key)) {
        event.preventDefault();
      }
      if (key === "printscreen") {
        document.body.classList.add("sb-protected-blur");
        setTimeout(() => document.body.classList.remove("sb-protected-blur"), 2000);
      }
    };

    const onBlur = () => document.body.classList.add("sb-protected-blur");
    const onFocus = () => document.body.classList.remove("sb-protected-blur");
    const onVisibility = () => {
      if (document.hidden) document.body.classList.add("sb-protected-blur");
      else document.body.classList.remove("sb-protected-blur");
    };

    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("dragstart", onDragStart, { capture: true });
    document.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, { capture: true });
      document.removeEventListener("dragstart", onDragStart, { capture: true });
      document.removeEventListener("keydown", onKeyDown, { capture: true });
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
