import { requireAdmin } from "../../../lib/admin-auth";
import { listAwards } from "../../../lib/awards";
import { getSiteUrl } from "../../../lib/site-url";

export const dynamic = "force-dynamic";

export default async function AdminAwardsPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const awards = await listAwards(100);
  const siteUrl = getSiteUrl();

  return (
    <>
      <header className="admin-head">
        <h1>Awards & certificates</h1>
        <p>Issue shareable certificates, track child-safe prize awards, and generate milestone certificates from leaderboard progress.</p>
      </header>

      {params?.saved ? <p className="admin-alert admin-alert-ok" role="status">Saved{params?.count ? ` (${params.count} created)` : ""}.</p> : null}
      {params?.error ? <p className="admin-alert admin-alert-error" role="alert">Action failed. Check required fields.</p> : null}

      <section className="admin-panel">
        <h2>Generate certificates</h2>
        <p className="admin-empty" style={{ marginBottom: 12 }}>Creates missing milestone certificates for top/eligible learners based on current leaderboard data. Public sharing is enabled by default; verify guardian consent before sharing externally where required.</p>
        <form action="/api/admin/awards" method="post">
          <input type="hidden" name="intent" value="generate_from_leaderboard" />
          <button type="submit" className="admin-button admin-button-primary">Generate from leaderboard</button>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Create award / certificate</h2>
        <form action="/api/admin/awards" method="post" className="admin-form">
          <input type="hidden" name="intent" value="create" />
          <div className="admin-grid">
            <label className="admin-field"><span>Learner name/alias</span><input name="learner_name" required maxLength={80} /></label>
            <label className="admin-field"><span>Award type</span>
              <select name="award_type" defaultValue="certificate">
                <option value="certificate">Certificate</option>
                <option value="badge">Badge</option>
                <option value="prize">Physical prize</option>
              </select>
            </label>
            <label className="admin-field admin-field-wide"><span>Award title</span><input name="award_title" required maxLength={160} placeholder="SkillBridge Python Builder Certificate" /></label>
            <label className="admin-field"><span>Milestone key</span><input name="milestone" maxLength={120} placeholder="first-step / top-10 / custom" /></label>
            <label className="admin-field"><span>Prize item</span><input name="prize_item" maxLength={120} placeholder="Branded pencil, t-shirt, book..." /></label>
            <label className="admin-field"><span>Guardian name</span><input name="guardian_name" maxLength={120} /></label>
            <label className="admin-field"><span>Guardian email</span><input name="guardian_email" type="email" maxLength={200} /></label>
            <label className="admin-field"><span>Status</span>
              <select name="status" defaultValue="awarded">
                <option value="awarded">Awarded</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
              </select>
            </label>
            <label className="admin-field admin-field-wide"><span>Details</span><textarea name="award_detail" rows={3} maxLength={500} placeholder="What the learner achieved" /></label>
            <label className="admin-check"><input type="checkbox" name="consent_verified" /><span>Guardian consent verified</span></label>
            <label className="admin-check"><input type="checkbox" name="public_share" defaultChecked /><span>Allow public shareable certificate page</span></label>
          </div>
          <button type="submit" className="admin-button admin-button-primary">Create award</button>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Award log ({awards.length})</h2>
        {awards.length === 0 ? <p className="admin-empty">No awards yet.</p> : (
          <ul className="admin-list">
            {awards.map((a) => {
              const shareUrl = `${siteUrl}/certificates/${a.share_token}`;
              return (
                <li key={a.id} className="admin-record">
                  <div className="admin-record-head">
                    <div>
                      <h3>{a.award_title}</h3>
                      <p className="admin-record-meta">{a.learner_alias || a.learner_name} · {a.award_type} · {a.status} · {new Date(a.issued_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`admin-pill admin-pill-${a.public_share ? "new" : "closed"}`}>{a.public_share ? "shareable" : "private"}</span>
                  </div>
                  <p className="admin-record-body">{a.award_detail || "No details"}</p>
                  <p className="admin-record-meta">Prize: {a.prize_item || "—"} · Guardian consent: {a.consent_verified ? "verified" : "not verified"}{a.consent_requested_at ? ` · requested ${new Date(a.consent_requested_at).toLocaleDateString()}` : ""}{a.consent_responded_at ? ` · responded ${new Date(a.consent_responded_at).toLocaleDateString()}` : ""} · <a href={shareUrl} target="_blank" rel="noreferrer">Share link ↗</a></p>
                  {a.guardian_email && !a.consent_verified ? (
                    <div className="admin-actions" style={{ marginTop: 8, flexWrap: "wrap" }}>
                      <form action="/api/admin/awards" method="post" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                        <input type="hidden" name="intent" value="request_consent" />
                        <input type="hidden" name="id" value={a.id} />
                        <button type="submit" className="admin-button admin-button-quiet">Request guardian consent</button>
                      </form>
                      <a className="admin-button admin-button-quiet" href={`/certificates/${a.share_token}/consent`} target="_blank" rel="noreferrer">Open consent page ↗</a>
                    </div>
                  ) : null}
                  <form action="/api/admin/awards" method="post" className="admin-actions" style={{ marginTop: 10 }}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="intent" value="update_status" />
                    <select name="status" defaultValue={a.status}>
                      <option value="awarded">Awarded</option>
                      <option value="pending">Pending</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    <label className="admin-check"><input type="checkbox" name="consent_verified" defaultChecked={a.consent_verified} /><span>Consent verified</span></label>
                    <label className="admin-check"><input type="checkbox" name="public_share" defaultChecked={a.public_share} /><span>Public share</span></label>
                    <button type="submit" className="admin-button admin-button-quiet">Save</button>
                  </form>
                  <form action="/api/admin/awards" method="post" style={{ marginTop: 8 }}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="intent" value="delete" />
                    <button type="submit" className="admin-button admin-button-danger">Delete</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
