"use client";

import { useMemo, useState } from "react";
import TurnstileWidget from "./turnstile-widget";

const AGE_GROUPS = ["7-9", "10-13", "14-16", "17+"];
const SKILLS = ["Python", "Web (HTML/CSS/JS)", "Robotics", "Scratch", "AI / ML", "Other"];

export default function ProjectSubmissionForm({ siteKey }) {
  const [status, setStatus] = useState({ type: "idle", msg: "" });
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  const descriptionCount = description.length;
  const imagePreview = useMemo(() => {
    const url = imageUrl.trim();
    if (!url) return "";
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
      return url;
    } catch {
      return "";
    }
  }, [imageUrl]);

  function validate(form) {
    const fd = new FormData(form);
    const next = {};
    if (!String(fd.get("learnerAlias") || "").trim()) next.learnerAlias = "Learner name/alias is required.";
    if (!String(fd.get("guardianName") || "").trim()) next.guardianName = "Guardian name is required.";
    const email = String(fd.get("guardianEmail") || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.guardianEmail = "A valid guardian email is required.";
    if (!String(fd.get("projectTitle") || "").trim()) next.projectTitle = "Project title is required.";
    if (String(fd.get("description") || "").trim().length < 20) next.description = "Describe your project in at least 20 characters.";
    if (fd.get("consentGuardian") !== "on") next.consentGuardian = "Guardian permission is required.";
    if (fd.get("consentPublish") !== "on") next.consentPublish = "Publishing permission is required.";
    return next;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

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
      setImageUrl("");
      setDescription("");
      setErrors({});
      const wid = form.querySelector("[data-turnstile-widget-id]")?.dataset.turnstileWidgetId;
      if (window.turnstile?.reset) try { window.turnstile.reset(wid ? Number(wid) : undefined); } catch {}
      setStatus({ type: "ok", msg: "Project submitted! Our team will review it. If approved, it may appear on the showcase." });
    } catch (err) {
      const wid = form.querySelector("[data-turnstile-widget-id]")?.dataset.turnstileWidgetId;
      if (window.turnstile?.reset) try { window.turnstile.reset(wid ? Number(wid) : undefined); } catch {}
      setStatus({ type: "error", msg: err.message || "Could not submit project." });
    } finally {
      setLoading(false);
    }
  }

  function fieldError(name) {
    return errors[name] ? <span className="submission-field-error">{errors[name]}</span> : null;
  }

  if (status.type === "ok") {
    return (
      <div className="submission-success">
        <div className="submission-success-icon" aria-hidden="true">🎉</div>
        <h3>Project submitted</h3>
        <p>{status.msg}</p>
        <button type="button" className="button button-primary" onClick={() => setStatus({ type: "idle", msg: "" })}>
          Submit another project
        </button>
      </div>
    );
  }

  return (
    <form className="submission-form" onSubmit={onSubmit} noValidate>
      <div className="submission-form-head">
        <h3>Share what you built</h3>
        <p>Tell us about your project. Approved projects may be featured on the SkillBridge learner showcase.</p>
      </div>

      <fieldset className="submission-fieldset">
        <legend>Learner &amp; guardian</legend>
        <div className="submission-grid">
          <label className={`form-field ${errors.learnerAlias ? "has-error" : ""}`}>
            <span>Learner first name / alias *</span>
            <input name="learnerAlias" required maxLength={80} placeholder="e.g. Ama" />
            {fieldError("learnerAlias")}
          </label>
          <label className="form-field">
            <span>Age group</span>
            <select name="ageGroup" defaultValue="">
              <option value="">Select…</option>
              {AGE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label className={`form-field ${errors.guardianName ? "has-error" : ""}`}>
            <span>Guardian name *</span>
            <input name="guardianName" required maxLength={120} placeholder="Parent / guardian" />
            {fieldError("guardianName")}
          </label>
          <label className={`form-field ${errors.guardianEmail ? "has-error" : ""}`}>
            <span>Guardian email *</span>
            <input name="guardianEmail" type="email" required maxLength={200} placeholder="guardian@example.com" />
            {fieldError("guardianEmail")}
          </label>
        </div>
      </fieldset>

      <fieldset className="submission-fieldset">
        <legend>Project details</legend>
        <div className="submission-grid">
          <label className={`form-field submission-wide ${errors.projectTitle ? "has-error" : ""}`}>
            <span>Project title *</span>
            <input name="projectTitle" required maxLength={160} placeholder="e.g. Number guessing game" />
            {fieldError("projectTitle")}
          </label>
          <label className="form-field">
            <span>Skill / program</span>
            <select name="skill" defaultValue="">
              <option value="">Select…</option>
              {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="form-field">
            <span>Project link (optional)</span>
            <input name="projectUrl" maxLength={1200} placeholder="https://..." />
          </label>
          <label className={`form-field submission-wide ${errors.description ? "has-error" : ""}`}>
            <span>What did you build? *</span>
            <textarea
              name="description"
              required
              maxLength={2000}
              rows={5}
              placeholder="Tell us what the project does, what you learned, and what skills you used."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <span className="submission-counter">{descriptionCount}/2000</span>
            {fieldError("description")}
          </label>
        </div>
      </fieldset>

      <fieldset className="submission-fieldset">
        <legend>Media (optional)</legend>
        <div className="submission-grid">
          <label className="form-field submission-wide">
            <span>Project image URL</span>
            <input
              name="imageUrl"
              maxLength={1200}
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </label>
          {imagePreview ? (
            <div className="submission-image-preview submission-wide">
              <img src={imagePreview} alt="Project preview" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            </div>
          ) : null}
        </div>
      </fieldset>

      <div className="submission-consents">
        <label className={`admin-check ${errors.consentGuardian ? "has-error" : ""}`}>
          <input type="checkbox" name="consentGuardian" required />
          <span>I am the parent/guardian and I give permission for this project to be reviewed by SkillBridge.</span>
        </label>
        {fieldError("consentGuardian")}
        <label className={`admin-check ${errors.consentPublish ? "has-error" : ""}`}>
          <input type="checkbox" name="consentPublish" required />
          <span>I give permission for SkillBridge to display this project on the website using the learner alias/first name only (no private contact details).</span>
        </label>
        {fieldError("consentPublish")}
      </div>

      {siteKey ? <TurnstileWidget siteKey={siteKey} action="project_submission" /> : null}
      {status.msg ? <p className={`admin-alert ${status.type === "ok" ? "admin-alert-ok" : "admin-alert-error"}`} role="status">{status.msg}</p> : null}
      <div className="submission-actions">
        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Submitting…" : "Submit project"}
        </button>
        <p className="submission-hint">We review submissions within a few days. Fields marked * are required.</p>
      </div>
    </form>
  );
}
