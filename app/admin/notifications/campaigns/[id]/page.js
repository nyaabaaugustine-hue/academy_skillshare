import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }) {
  await requireAdmin();
  const { id } = await params;

  let campaign = null;
  let deliveries = [];
  try {
    const rows = await db()`select * from notification_campaigns where id = ${id} limit 1`;
    campaign = rows[0] || null;
  } catch { campaign = null; }
  if (!campaign) {
    return <p className="admin-empty">Campaign not found.</p>;
  }
  try {
    deliveries = await db()`select delivery_status, count(*)::int as count from notification_deliveries where campaign_id = ${id} group by delivery_status`;
  } catch { deliveries = []; }

  const unreadRows = await db()`select count(*)::int as count from notifications where campaign_id = ${id} and read_at is null`.catch(() => [{ count: 0 }]);
  const readRows = await db()`select count(*)::int as count from notifications where campaign_id = ${id} and read_at is not null`.catch(() => [{ count: 0 }]);

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>{campaign.campaign_name || campaign.title}</h1>
          <p>{campaign.title} — {campaign.status}</p>
        </div>
        <div className="admin-actions">
          {campaign.status === "draft" || campaign.status === "scheduled" ? (
            <form action={`/api/admin/notifications/campaigns/${id}/send`} method="post" style={{ display: "inline" }}>
              <button type="submit" className="admin-button admin-button-primary">Send now</button>
            </form>
          ) : null}
          {campaign.status === "partially_completed" || campaign.status === "failed" ? (
            <form action={`/api/admin/notifications/campaigns/${id}/retry`} method="post" style={{ display: "inline" }}>
              <button type="submit" className="admin-button admin-button-quiet">Retry</button>
            </form>
          ) : null}
          {campaign.status === "draft" || campaign.status === "scheduled" ? (
            <form action={`/api/admin/notifications/campaigns/${id}/cancel`} method="post" style={{ display: "inline" }}>
              <button type="submit" className="admin-button admin-button-danger">Cancel</button>
            </form>
          ) : null}
        </div>
      </header>

      <section className="admin-panel">
        <h2>Details</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <tbody>
              <tr><th>Title</th><td>{campaign.title}</td></tr>
              <tr><th>Message</th><td style={{ whiteSpace: "pre-wrap" }}>{campaign.message}</td></tr>
              <tr><th>Category</th><td>{campaign.category}</td></tr>
              <tr><th>Audience</th><td>{campaign.audience_type}</td></tr>
              <tr><th>Platforms</th><td>{Array.isArray(campaign.platform_filter) ? campaign.platform_filter.join(", ") : "—"}</td></tr>
              <tr><th>Image</th><td>{campaign.image_url ? <a href={campaign.image_url} target="_blank" rel="noreferrer">view</a> : "—"}</td></tr>
              <tr><th>Action URL</th><td>{campaign.action_url || "—"}</td></tr>
              <tr><th>Targeted users</th><td>{campaign.targeted_users}</td></tr>
              <tr><th>Targeted devices</th><td>{campaign.targeted_devices}</td></tr>
              <tr><th>Success / Fail</th><td>{campaign.success_count} / {campaign.failure_count}</td></tr>
              <tr><th>Scheduled</th><td>{campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : "—"}</td></tr>
              <tr><th>Sent</th><td>{campaign.sent_at ? new Date(campaign.sent_at).toLocaleString() : "—"}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <h2>Delivery breakdown</h2>
        {deliveries.length === 0 ? <p className="admin-empty">No deliveries recorded.</p> : (
          <ul className="admin-list">
            {deliveries.map((d) => (
              <li key={d.delivery_status} className="admin-record">
                <div className="admin-record-head">
                  <h3>{d.delivery_status}</h3>
                  <span className="admin-pill">{d.count}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel">
        <h2>In-app read tracking</h2>
        <p className="admin-muted">Unread: {unreadRows[0]?.count || 0} · Read: {readRows[0]?.count || 0}</p>
      </section>
    </>
  );
}
