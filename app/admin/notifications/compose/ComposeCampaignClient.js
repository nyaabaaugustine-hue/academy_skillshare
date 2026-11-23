"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AUDIENCES = [
  { value: "all", label: "All registered users" },
  { value: "selected_users", label: "Selected user IDs" },
  { value: "role", label: "By role (all active device owners)" },
];

const PLATFORMS = ["android", "ios", "web"];
const CATEGORIES = ["general","announcement","system","account","security","reminder","promotion","education","event"];

export default function ComposeCampaignClient() {
  const router = useRouter();
  const [form, setForm] = useState({
    campaign_name: "",
    title: "",
    message: "",
    image_url: "",
    action_url: "",
    category: "general",
    audience_type: "all",
    user_ids: "",
    platform_android: true,
    platform_ios: true,
    platform_web: true,
    scheduled_at: "",
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    setSuccess("");
    const platforms = PLATFORMS.filter((p) => form[`platform_${p}`]);
    if (platforms.length === 0) { setError("Select at least one platform."); setStatus("idle"); return; }

    const audienceFilter = form.audience_type === "selected_users"
      ? { user_ids: form.user_ids.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean) }
      : {};

    const payload = {
      campaign_name: form.campaign_name || null,
      title: form.title,
      message: form.message,
      image_url: form.image_url || null,
      action_url: form.action_url || null,
      category: form.category,
      audience_type: form.audience_type,
      audience_filter: audienceFilter,
      platform_filter: platforms,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    };

    try {
      const res = await fetch("/api/admin/notifications/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Could not create campaign.");
      setSuccess("Campaign created.");
      setTimeout(() => router.push(`/admin/notifications/campaigns/${data.campaign.id}`), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create campaign.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
      {error ? <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p> : null}
      {success ? <p style={{ color: "#10b981", fontSize: 13, margin: 0 }}>{success}</p> : null}

      <label className="admin-field"><span>Campaign name (optional)</span>
        <input className="admin-input" value={form.campaign_name} onChange={(e) => update("campaign_name", e.target.value)} maxLength={160} />
      </label>
      <label className="admin-field"><span>Title *</span>
        <input className="admin-input" value={form.title} onChange={(e) => update("title", e.target.value)} required maxLength={160} />
      </label>
      <label className="admin-field"><span>Message *</span>
        <textarea className="admin-input" rows={4} value={form.message} onChange={(e) => update("message", e.target.value)} required maxLength={2000} />
      </label>
      <label className="admin-field"><span>Image URL (optional)</span>
        <input className="admin-input" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} maxLength={1200} placeholder="https://..." />
      </label>
      <label className="admin-field"><span>Action URL / deep link (optional)</span>
        <input className="admin-input" value={form.action_url} onChange={(e) => update("action_url", e.target.value)} maxLength={500} placeholder="/notifications or app deep link" />
      </label>
      <label className="admin-field"><span>Category</span>
        <select className="admin-input" value={form.category} onChange={(e) => update("category", e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="admin-field"><span>Audience</span>
        <select className="admin-input" value={form.audience_type} onChange={(e) => update("audience_type", e.target.value)}>
          {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </label>
      {form.audience_type === "selected_users" ? (
        <label className="admin-field"><span>User IDs (comma/space separated)</span>
          <textarea className="admin-input" rows={3} value={form.user_ids} onChange={(e) => update("user_ids", e.target.value)} placeholder="user-1, user-2" />
        </label>
      ) : null}
      <div className="admin-field">
        <span>Platforms</span>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {PLATFORMS.map((p) => (
            <label key={p} className="admin-check">
              <input type="checkbox" checked={form[`platform_${p}`]} onChange={(e) => update(`platform_${p}`, e.target.checked)} />
              <span>{p}</span>
            </label>
          ))}
        </div>
      </div>
      <label className="admin-field"><span>Schedule (optional, UTC)</span>
        <input className="admin-input" type="datetime-local" value={form.scheduled_at} onChange={(e) => update("scheduled_at", e.target.value)} />
        <span className="admin-muted" style={{ fontSize: 11 }}>Leave empty to save as draft. Use Send on the detail page to send immediately.</span>
      </label>
      <button type="submit" className="admin-button admin-button-primary" disabled={status === "sending"}>
        {status === "sending" ? "Creating…" : "Create campaign"}
      </button>
    </form>
  );
}
