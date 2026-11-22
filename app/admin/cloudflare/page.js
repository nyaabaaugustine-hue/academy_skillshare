import { requireAdmin } from "../../../lib/admin-auth";
import { cloudflareServiceStatus } from "../../../lib/cloudflare/config.js";
import { getCloudflareUsage, DEFAULT_THRESHOLDS } from "../../../lib/cloudflare/usage.js";

export const metadata = { title: "Cloudflare infrastructure — SkillBridge admin" };

export const dynamic = "force-dynamic";

const labels = [
  ["tutorWorker", "Tutor Worker"],
  ["turnstile", "Turnstile"],
  ["r2", "R2 storage (not used)"],
  ["aiGateway", "AI Gateway"],
  ["analytics", "Web Analytics"],
  ["usageApi", "Usage API"],
];

export default async function CloudflareAdminPage() {
  await requireAdmin();
  const status = cloudflareServiceStatus();
  const usage = await getCloudflareUsage();

  return (
    <section className="admin-section">
      <header className="admin-section-head">
        <div>
          <span className="admin-eyebrow">INFRASTRUCTURE</span>
          <h1>Cloudflare (free tier)</h1>
          <p className="admin-muted">
            Status, free-tier guardrails and setup links. Secrets are never shown here.
          </p>
        </div>
      </header>

      <div className="admin-cards">
        {labels.map(([key, label]) => (
          <article className="admin-card" key={key}>
            <span className="admin-muted">{label}</span>
            <strong>{status[key] ? "Configured" : "Not configured"}</strong>
            <small>{status[key] ? "Ready" : "Add env vars / dashboard setup"}</small>
          </article>
        ))}
      </div>

      <article className="admin-card">
        <h2>Free-tier guard</h2>
        <p className="admin-muted">
          Threshold: {Math.round(DEFAULT_THRESHOLDS.warnAt * 100)}% of configured daily allowances.
          No billing or automatic upgrades are enabled by this app.
        </p>
        {usage.ok ? (
          <ul>
            <li>Worker requests (24h): {usage.usage.workerRequests24h.toLocaleString()}</li>
            <li>Worker errors (24h): {usage.usage.workerErrors24h.toLocaleString()}</li>
            <li>{usage.warning ? "Warning: near threshold" : "Within threshold"}</li>
          </ul>
        ) : (
          <p className="admin-muted">
            Live usage unavailable ({usage.reason}). Use the Cloudflare dashboard for exact usage.
          </p>
        )}
        <p>
          <a className="admin-text-link" href={usage.dashboardUrl} target="_blank" rel="noreferrer">
            Open Cloudflare dashboard
          </a>
        </p>
      </article>

      <article className="admin-card">
        <h2>Manual setup</h2>
        <ul>
          <li>Enable Turnstile and add site/secret keys.</li>
          <li>Storage: R2 not used (requires subscription confirmation). Use free alternatives: Cloudinary, <code>/public</code> assets, Neon metadata, or external links.</li>
          <li>Create an AI Gateway and set its id.</li>
          <li>Add the Web Analytics token to the site env.</li>
          <li>Create a least-privilege API token for read-only usage analytics.</li>
        </ul>
        <p className="admin-muted">
          See <code>docs/CLOUDFLARE_FREE_TIER.md</code> for the full checklist.
        </p>
      </article>
    </section>
  );
}
