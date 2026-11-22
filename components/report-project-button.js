"use client";

import { useState } from "react";
import TurnstileWidget from "./turnstile-widget";

export default function ReportProjectButton({ projectId, projectTitle, siteKey }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState({ type: "idle", msg: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    setStatus({ type: "idle", msg: "" });
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          projectTitle,
          reason: fd.get("reason"),
          details: fd.get("details"),
          reporterEmail: fd.get("reporterEmail"),
          turnstileToken: fd.get("cf-turnstile-response") || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not submit report.");
      setStatus({ type: "ok", msg: "Report received. Our team will review it." });
      e.currentTarget.reset();
      const wid = e.currentTarget.querySelector("[data-turnstile-widget-id]")?.dataset.turnstileWidgetId;
      if (window.turnstile?.reset) try { window.turnstile.reset(wid ? Number(wid) : undefined); } catch {}
    } catch (err) {
      const wid = e.currentTarget.querySelector("[data-turnstile-widget-id]")?.dataset.turnstileWidgetId;
      if (window.turnstile?.reset) try { window.turnstile.reset(wid ? Number(wid) : undefined); } catch {}
      setStatus({ type: "error", msg: err.message || "Could not submit report." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="report-project">
      <button type="button" className="report-project-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Close report" : "Report"}
      </button>
      {open ? (
        <form className="report-project-form" onSubmit={onSubmit}>
          <label><span>Reason</span>
            <select name="reason" required defaultValue="">
              <option value="" disabled>Select reason</option>
              <option value="pii">Contains private/personal information</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="copyright">Copyright concern</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label><span>Details</span><textarea name="details" required maxLength={1200} rows={3} /></label>
          <label><span>Your email (optional)</span><input name="reporterEmail" type="email" maxLength={200} /></label>
          {siteKey ? <TurnstileWidget siteKey={siteKey} action="report_project" /> : null}
          {status.msg ? <p className={`admin-alert ${status.type === "ok" ? "admin-alert-ok" : "admin-alert-error"}`} role="status">{status.msg}</p> : null}
          <button type="submit" className="button button-primary button-small" disabled={loading}>{loading ? "Sending..." : "Send report"}</button>
        </form>
      ) : null}
    </div>
  );
}
