import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

async function getCampaigns() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/notifications/campaigns`, { cache: "no-store" });
    // Server components can't easily use fetch with cookies; instead query DB directly.
    return null;
  } catch {
    return null;
  }
}

export default async function CampaignsListPage() {
  await requireAdmin();
  // Query DB directly for server rendering.
  const { db } = await import("@/lib/db");
  let campaigns = [];
  try {
    campaigns = await db()`select * from notification_campaigns order by created_at desc limit 100`;
  } catch {
    campaigns = [];
  }

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Notification campaigns</h1>
          <p>{campaigns.length} campaigns. Create new ones from the compose page.</p>
        </div>
        <div className="admin-actions">
          <a className="admin-button admin-button-primary" href="/admin/notifications/compose">Compose campaign</a>
        </div>
      </header>
      {campaigns.length === 0 ? (
        <p className="admin-empty">No campaigns yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name / Title</th>
                <th>Audience</th>
                <th>Platforms</th>
                <th>Status</th>
                <th>Targeted</th>
                <th>Success / Fail</th>
                <th>Scheduled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.campaign_name || c.title}</b>
                    <div className="admin-muted" style={{ fontSize: 11 }}>{c.title}</div>
                  </td>
                  <td>{c.audience_type}</td>
                  <td>{Array.isArray(c.platform_filter) ? c.platform_filter.join(", ") : "—"}</td>
                  <td><span className="admin-pill">{c.status}</span></td>
                  <td>{c.targeted_users} users / {c.targeted_devices} devices</td>
                  <td>{c.success_count} / {c.failure_count}</td>
                  <td>{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : "—"}</td>
                  <td>
                    <a className="admin-button admin-button-quiet" href={`/admin/notifications/campaigns/${c.id}`}>View</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
