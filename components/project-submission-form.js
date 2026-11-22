"use client";

import { useState } from "react";
import TurnstileWidget from "./turnstile-widget";

export default function ProjectSubmissionForm({ siteKey }) {
  const [status, setStatus] = useState({ type: "idle", msg: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const turnstileToken = fd.get("cf-turnstile-response") || "";
    const payload = {
      learnerAlias: fd.get("learnerAlias"),
      ageGroup: fd.get("ageGroup"),
      guardianName: fd.get("guardianName"),
      guardianEmail: fd.get("guardianEmail"),
      projectTitle: fd.get("projectTitle"),
      skill: fd.get("skill"),
      description: fd.get("description"),
      projectUrl: fd.get("projectUrl"),
      imageUrl: fd.get("imageUrl"),
      consentGuardian: fd.get("consentGuardian") === "on",
      consentPublish: fd.get("consentPublish") === "on",
      turnstileToken,
    };
    setLoading(true);
    setStatus({ type: "idle", msg: "" });
    try {
      const res = await fetch("/api/project-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not submit project.");
      form.reset();
      if (window.turnstile?.reset) try { window.turnstile.reset(); } catch {}
      setStatus({ type: "ok", msg: "Project submitted! Our team will review it. If approved, it may appear on the showcase." });
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Could not submit project." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="submission-form" onSubmit={onSubmit}>
      <div className="submission-grid">
        <label className="form-field"><span>Learner first name / alias *</span><input name="learnerAlias" required maxLength={80} /></label>
        <label className="form-field"><span>Age group</span><input name="ageGroup" maxLength={40} placeholder="e.g. 10-13" /></label>
        <label className="form-field"><span>Guardian name *</span><input name="guardianName" required maxLength={120} /></label>
        <label className="form-field"><span>Guardian email *</span><input name="guardianEmail" type="email" required maxLength={200} /></label>
        <label className="form-field submission-wide"><span>Project title *</span><input name="projectTitle" required maxLength={160} /></label>
        <label className="form-field"><span>Skill / program</span><input name="skill" maxLength={80} placeholder="Python, Web, Robotics..." /></label>
        <label className="form-field"><span>Project link (optional)</span><input name="projectUrl" maxLength={1200} placeholder="https://..." /></label>
        <label className="form-field submission-wide"><span>Project image URL (optional)</span><input name="imageUrl" maxLength={1200} placeholder="https://..." /></label>
        <label className="form-field submission-wide"><span>What did you build? *</span><textarea name="description" required maxLength={2000} rows={4} placeholder="Tell us what the project does, what you learned, and what skills you used." /></label>
      </div>
      <div className="submission-consents">
        <label className="admin-check"><input type="checkbox" name="consentGuardian" required /> <span>I am the parent/guardian and I give permission for this project to be reviewed by SkillBridge.</span></label>
        <label className="admin-check"><input type="checkbox" name="consentPublish" required /> <span>I give permission for SkillBridge to display this project on the website using the learner alias/first name only (no private contact details).</span></label>
      </div>
      {siteKey ? <TurnstileWidget siteKey={siteKey} action="project_submission" /> : null}
      {status.msg ? <p className={`admin-alert ${status.type === "ok" ? "admin-alert-ok" : "admin-alert-error"}`} role="status">{status.msg}</p> : null}
      <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit project"}</button>
    </form>
  );
}
