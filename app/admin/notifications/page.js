import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { buildAdminDigest } from "@/lib/admin-digest";

export const dynamic = "force-dynamic";

function fmt(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export default async function AdminNotificationsPage() {
  await requireAdmin();

  let enquiries = [];
  let awards = [];
  let leaderboard = [];
  let migrationMissing = false;
  try {
    enquiries = await db()`select id, school_name, contact_name, email, status, created_at, follow_up_at from school_enquiries order by created_at desc limit 100`;
  } catch { migrationMissing = true; }
  try { awards = await db()`select id, learner_alias, award_title, status, consent_verified, guardian_email, issued_at from learner_awards order by issued_at desc limit 100`; } catch {}
  try { leaderboard = await db()`select id, name, score, course_slug, updated_at from leaderboard_entries order by score asc limit 100`; } catch {}

  // eslint-disable-next-line react-hooks/purity -- server-rendered per request
  const now = Date.now();
  const overdue = enquiries.filter((r) => r.follow_up_at && new Date(r.follow_up_at).getTime() < now && !["closed", "lost", "enrolled"].includes(r.status));
  const newEnquiries = enquiries.filter((r) => r.status === "new");
  const atRisk = leaderboard.filter((r) => Number(r.score || 0) < 40);
  const awaitingConsent = awards.filter((a) => !a.consent_verified && a.guardian_email);

  const digest = await buildAdminDigest().catch(() => null);

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Notifications & digest</h1>
          <p>Operational alerts, overdue follow-ups, at-risk learners, and consent requests.</p>
        </div>
        <div className="admin-actions">
          <form action="/api/admin/notifications/digest" method="post">
            <button type="submit" className="admin-button admin-button-primary">Email me a digest</button>
          </form>
        </div>
      </header>

      {migrationMissing ? (
        <p className="admin-alert admin-alert-error" role="alert">Enquiry migration missing. Run db/007_enquiry_pipeline.sql in Neon.</p>
      ) : null}

      <section className="admin-kpi-grid" aria-label="Notification KPIs">
        {[
          ["New enquiries", newEnquiries.length],
          ["Overdue follow-ups", overdue.length],
          ["At-risk learners", atRisk.length],
          ["Awards awaiting consent", awaitingConsent.length],
        ].map(([label, value]) => (
          <div key={label} className="admin-kpi-card"><span className="admin-kpi-value">{value}</span><span className="admin-kpi-label">{label}</span></div>
        ))}
      </section>

      <section className="admin-panel">
        <h2>Overdue follow-ups ({overdue.length})</h2>
        {overdue.length === 0 ? <p className="admin-empty">None.</p> : (
          <ul className="admin-list">
            {overdue.slice(0, 20).map((r) => (
              <li key={r.id} className="admin-record">
                <div className="admin-record-head">
                  <div><h3>#{r.id} {r.school_name}</h3><p className="admin-record-meta">{r.contact_name} · {r.email} · follow-up was {fmt(r.follow_up_at)}</p></div>
                  <a className="admin-button admin-button-quiet" href={`/admin/enquiries`}>Open</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel">
        <h2>New enquiries ({newEnquiries.length})</h2>
        {newEnquiries.length === 0 ? <p className="admin-empty">None.</p> : (
          <ul className="admin-list">
            {newEnquiries.slice(0, 20).map((r) => (
              <li key={r.id} className="admin-record">
                <div className="admin-record-head">
                  <div><h3>#{r.id} {r.school_name}</h3><p className="admin-record-meta">{r.contact_name} · {r.email} · {fmt(r.created_at)}</p></div>
                  <a className="admin-button admin-button-quiet" href={`/admin/enquiries`}>Open</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel">
        <h2>At-risk learners ({atRisk.length})</h2>
        {atRisk.length === 0 ? <p className="admin-empty">None flagged by score heuristic.</p> : (
          <ul className="admin-list">
            {atRisk.slice(0, 20).map((r) => (
              <li key={r.id} className="admin-record">
                <div className="admin-record-head">
                  <div><h3>{r.name}</h3><p className="admin-record-meta">{r.course_slug || "—"} · score {r.score} · last activity {fmt(r.updated_at)}</p></div>
                  <a className="admin-button admin-button-quiet" href="/admin/at-risk">Open</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel">
        <h2>Awards awaiting guardian consent ({awaitingConsent.length})</h2>
        {awaitingConsent.length === 0 ? <p className="admin-empty">None.</p> : (
          <ul className="admin-list">
            {awaitingConsent.slice(0, 20).map((a) => (
              <li key={a.id} className="admin-record">
                <div className="admin-record-head">
                  <div><h3>{a.award_title}</h3><p className="admin-record-meta">{a.learner_alias} · guardian {a.guardian_email} · issued {fmt(a.issued_at)}</p></div>
                  <a className="admin-button admin-button-quiet" href="/admin/awards">Open</a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {digest ? (
        <section className="admin-panel">
          <h2>Digest preview</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#e5e7eb", background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8, margin: 0 }}>{digest.text}</pre>
        </section>
      ) : null}
    </>
  );
}
