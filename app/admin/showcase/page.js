import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

function ShowcaseFields({ item }) {
  return (
    <div className="admin-grid">
      <label className="admin-field admin-field-wide"><span>Project title</span><input name="title" defaultValue={item?.title ?? ""} required maxLength={180} /></label>
      <label className="admin-field"><span>Learner name/alias</span><input name="learner_name" defaultValue={item?.learner_name ?? ""} maxLength={120} /></label>
      <label className="admin-field"><span>Skill</span><input name="skill" defaultValue={item?.skill ?? ""} maxLength={80} /></label>
      <label className="admin-field"><span>Order</span><input name="position" type="number" defaultValue={item?.position ?? 0} min={0} max={999} /></label>
      <label className="admin-field admin-field-wide"><span>Image URL</span><input name="image" defaultValue={item?.image ?? ""} maxLength={1200} /></label>
      <label className="admin-field admin-field-wide"><span>Project URL</span><input name="project_url" defaultValue={item?.project_url ?? ""} maxLength={1200} /></label>
      <label className="admin-field admin-field-wide"><span>Description</span><textarea name="description" rows={3} defaultValue={item?.description ?? ""} maxLength={2000} /></label>
      <label className="admin-check"><input type="checkbox" name="published" defaultChecked={item?.published ?? true} /><span>Published on website</span></label>
    </div>
  );
}

export default async function AdminShowcasePage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;

  let submissions = [];
  let showcase = [];
  let reports = [];
  let loadError = false;
  try {
    [submissions, showcase] = await Promise.all([
      db()`select * from project_submissions order by created_at desc limit 50`,
      db()`select * from project_showcase order by position asc, id desc limit 50`,
    ]);
  } catch {
    loadError = true;
  }
  try {
    reports = await db()`select * from project_reports order by created_at desc limit 50`;
  } catch {
    reports = [];
  }

  return (
    <>
      <header className="admin-head">
        <h1>Learner showcase</h1>
        <p>Review project submissions, approve child-safe projects, and publish them to the website showcase.</p>
      </header>

      <section className="admin-panel">
        <h2>Moderation checklist</h2>
        <ul className="admin-empty" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Confirm guardian consent and publish permission before publishing.</li>
          <li>Use first name/alias only - no full names, emails, phone numbers, addresses, or school IDs in public fields.</li>
          <li>Check images/links for inappropriate content, personal data, or copyright concerns.</li>
          <li>Review reports promptly and hide/remove unsafe content.</li>
        </ul>
      </section>

      {params?.saved ? <p className="admin-alert admin-alert-ok" role="status">Saved.</p> : null}
      {params?.error ? <p className="admin-alert admin-alert-error" role="alert">Action failed. Check required fields.</p> : null}
      {loadError ? <p className="admin-alert admin-alert-error" role="alert">Could not load showcase data. Ensure DB tables exist.</p> : null}

      <section className="admin-panel">
        <h2>Project submissions ({submissions.length})</h2>
        {submissions.length === 0 ? <p className="admin-empty">No project submissions yet.</p> : (
          <ul className="admin-list">
            {submissions.map((s) => (
              <li key={s.id} className="admin-record">
                <div className="admin-record-head">
                  <div>
                    <h3>{s.project_title}</h3>
                    <p className="admin-record-meta">{s.learner_alias} · {s.age_group || "Age N/A"} · {s.skill || "Skill N/A"} · {s.guardian_email}</p>
                  </div>
                  <span className={`admin-pill admin-pill-${s.status === "published" ? "new" : s.status === "rejected" ? "closed" : "pending"}`}>{s.status}</span>
                </div>
                <p className="admin-record-body">{s.description}</p>
                <div className="admin-record-meta" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {s.project_url ? <a href={s.project_url} target="_blank" rel="noreferrer">Project link ↗</a> : null}
                  {s.image_url ? <a href={s.image_url} target="_blank" rel="noreferrer">Image ↗</a> : null}
                  <span>Guardian consent: {s.consent_guardian ? "yes" : "no"}</span>
                  <span>Publish consent: {s.consent_publish ? "yes" : "no"}</span>
                </div>
                <div className="admin-form" style={{ marginTop: 12 }}>
                  <form action="/api/admin/showcase" method="post" className="admin-form">
                    <input type="hidden" name="id" value={s.id} />
                    <label className="admin-field admin-field-wide"><span>Admin note</span><input name="admin_note" defaultValue={s.admin_note ?? ""} maxLength={1000} /></label>
                    <div className="admin-actions">
                      <button className="admin-button admin-button-primary" name="intent" value="publish_submission" type="submit">Approve &amp; publish</button>
                    </div>
                  </form>
                  <div className="admin-actions">
                    <form action="/api/admin/showcase" method="post"><input type="hidden" name="id" value={s.id} /><input type="hidden" name="intent" value="submission_status" /><input type="hidden" name="status" value="reviewed" /><input type="hidden" name="admin_note" value={s.admin_note ?? ""} /><button className="admin-button admin-button-quiet" type="submit">Mark reviewed</button></form>
                    <form action="/api/admin/showcase" method="post"><input type="hidden" name="id" value={s.id} /><input type="hidden" name="intent" value="submission_status" /><input type="hidden" name="status" value="rejected" /><input type="hidden" name="admin_note" value={s.admin_note ?? ""} /><button className="admin-button admin-button-danger" type="submit">Reject</button></form>
                    <form action="/api/admin/showcase" method="post"><input type="hidden" name="id" value={s.id} /><input type="hidden" name="intent" value="delete_submission" /><button className="admin-button admin-button-danger" type="submit">Delete</button></form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel">
        <h2>Add showcase item</h2>
        <form action="/api/admin/showcase" method="post" className="admin-form">
          <input type="hidden" name="intent" value="create_showcase" />
          <ShowcaseFields />
          <button type="submit" className="admin-button admin-button-primary">Add to showcase</button>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Published showcase ({showcase.length})</h2>
        {showcase.length === 0 ? <p className="admin-empty">No showcase items yet.</p> : (
          <ul className="admin-list">
            {showcase.map((item) => (
              <li key={item.id} className="admin-record">
                <div className="admin-record-head">
                  <div><h3>{item.title}</h3><p className="admin-record-meta">{item.learner_name || "Learner"} · {item.skill || "Skill"}</p></div>
                  <span className={`admin-pill admin-pill-${item.published ? "new" : "closed"}`}>{item.published ? "published" : "hidden"}</span>
                </div>
                <details className="admin-details">
                  <summary>Edit</summary>
                  <form action="/api/admin/showcase" method="post" className="admin-form">
                    <input type="hidden" name="intent" value="update_showcase" />
                    <input type="hidden" name="id" value={item.id} />
                    <ShowcaseFields item={item} />
                    <button type="submit" className="admin-button admin-button-primary">Save</button>
                  </form>
                </details>
                <form action="/api/admin/showcase" method="post" className="admin-actions">
                  <input type="hidden" name="intent" value="delete_showcase" />
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="admin-button admin-button-danger">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-panel">
        <h2>Project reports ({reports.length})</h2>
        {reports.length === 0 ? <p className="admin-empty">No reports yet.</p> : (
          <ul className="admin-list">
            {reports.map((r) => (
              <li key={r.id} className="admin-record">
                <div className="admin-record-head">
                  <div><h3>{r.project_title || `Project #${r.project_id || "?"}`}</h3><p className="admin-record-meta">{r.reason} · {r.reporter_email || "No reporter email"} · {new Date(r.created_at).toLocaleString()}</p></div>
                  <span className={`admin-pill admin-pill-${r.status === "new" ? "pending" : r.status === "resolved" ? "new" : "closed"}`}>{r.status}</span>
                </div>
                <p className="admin-record-body">{r.details}</p>
                <div className="admin-actions">
                  <form action="/api/admin/showcase" method="post"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="intent" value="report_status" /><input type="hidden" name="status" value="reviewed" /><button type="submit" className="admin-button admin-button-quiet">Mark reviewed</button></form>
                  <form action="/api/admin/showcase" method="post"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="intent" value="report_status" /><input type="hidden" name="status" value="resolved" /><button type="submit" className="admin-button admin-button-primary">Resolve</button></form>
                  <form action="/api/admin/showcase" method="post"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="intent" value="delete_report" /><button type="submit" className="admin-button admin-button-danger">Delete</button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
