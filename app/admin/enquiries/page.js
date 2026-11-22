import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "scheduled", "enrolled", "closed", "lost"];

const when = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(d);
};

const dateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function norm(v) { return String(v || "").trim().toLowerCase(); }

export default async function AdminEnquiriesPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const q = norm(params?.q);
  const statusFilter = norm(params?.status);
  const view = norm(params?.view);

  let rows = [];
  let migrationMissing = false;
  try {
    rows = await db()`
      select id, school_name, school_location, contact_name, email, phone,
             learner_count, programme_interest, message, status, source,
             assigned_to, admin_note, follow_up_at, last_contacted_at, created_at, updated_at
      from school_enquiries
      order by created_at desc
    `;
  } catch {
    try {
      rows = await db()`
        select id, school_name, school_location, contact_name, email, phone,
               learner_count, programme_interest, message, status, created_at,
               null::text as source, null::text as assigned_to, null::text as admin_note,
               null::timestamptz as follow_up_at, null::timestamptz as last_contacted_at, created_at as updated_at
        from school_enquiries
        order by created_at desc
      `;
      migrationMissing = true;
    } catch {
      rows = [];
    }
  }

  // eslint-disable-next-line react-hooks/purity -- server-rendered per request
  const now = Date.now();
  const emailCounts = new Map();
  for (const r of rows) {
    const e = norm(r.email);
    if (e) emailCounts.set(e, (emailCounts.get(e) || 0) + 1);
  }

  const enriched = rows.map((r) => {
    const email = norm(r.email);
    const duplicate = email && (emailCounts.get(email) || 0) > 1;
    const followUpAt = r.follow_up_at ? new Date(r.follow_up_at).getTime() : null;
    const overdue = followUpAt !== null && followUpAt < now && !["closed", "lost", "enrolled"].includes(r.status);
    const stale = !["closed", "lost", "enrolled"].includes(r.status) && (now - new Date(r.created_at).getTime()) > 3 * 24 * 60 * 60 * 1000;
    const needsAttention = r.status === "new" || overdue || stale;
    return { ...r, duplicate, overdue, stale, needsAttention };
  });

  const filtered = enriched.filter((r) => {
    if (statusFilter && statusFilter !== "all" && norm(r.status) !== statusFilter) return false;
    if (view === "attention" && !r.needsAttention) return false;
    if (q) {
      const hay = [r.school_name, r.school_location, r.contact_name, r.email, r.phone, r.programme_interest, r.message, r.admin_note, r.assigned_to, r.source, r.status].map(norm).join(" ");
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const counts = {
    total: enriched.length,
    new: enriched.filter((r) => r.status === "new").length,
    contacted: enriched.filter((r) => r.status === "contacted").length,
    scheduled: enriched.filter((r) => r.status === "scheduled").length,
    enrolled: enriched.filter((r) => r.status === "enrolled").length,
    closed: enriched.filter((r) => r.status === "closed").length,
    lost: enriched.filter((r) => r.status === "lost").length,
    overdue: enriched.filter((r) => r.overdue).length,
    attention: enriched.filter((r) => r.needsAttention).length,
    duplicates: enriched.filter((r) => r.duplicate).length,
  };

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>School enquiries</h1>
          <p>{counts.total} total · {counts.attention} need attention · {counts.duplicates} duplicate email(s)</p>
        </div>
        <div className="admin-actions">
          <a className="admin-button admin-button-quiet" href="/api/admin/enquiries?format=csv">Export CSV</a>
        </div>
      </header>

      {migrationMissing ? (
        <p className="admin-alert admin-alert-error" role="alert">
          Enquiry pipeline migration is missing. Run <code>db/007_enquiry_pipeline.sql</code> in Neon to enable notes, assignment, follow-ups, and source tracking.
        </p>
      ) : null}
      {params?.saved ? <p className="admin-alert admin-alert-ok" role="status">Saved.</p> : null}
      {params?.error ? <p className="admin-alert admin-alert-error" role="alert">That change did not save. Check details and try again.</p> : null}

      <section className="admin-kpi-grid" aria-label="Enquiry KPIs">
        {[
          ["New", counts.new], ["Contacted", counts.contacted], ["Scheduled", counts.scheduled],
          ["Enrolled", counts.enrolled], ["Closed/Lost", counts.closed + counts.lost], ["Overdue follow-up", counts.overdue],
        ].map(([label, value]) => (
          <div key={label} className="admin-kpi-card"><span className="admin-kpi-value">{value}</span><span className="admin-kpi-label">{label}</span></div>
        ))}
      </section>

      <section className="admin-panel" style={{ marginBottom: 20 }}>
        <form method="get" className="admin-filter-bar">
          <input className="admin-input" type="search" name="q" defaultValue={params?.q || ""} placeholder="Search school, contact, email, note..." />
          <select className="admin-input" name="status" defaultValue={statusFilter || "all"}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="admin-input" name="view" defaultValue={view || "all"}>
            <option value="all">All enquiries</option>
            <option value="attention">Needs attention</option>
          </select>
          <button className="admin-button admin-button-quiet" type="submit">Filter</button>
          <a className="admin-button admin-button-quiet" href="/admin/enquiries">Reset</a>
        </form>
      </section>

      {filtered.length === 0 ? (
        <p className="admin-empty">No enquiries match this view.</p>
      ) : (
        <ul className="admin-list">
          {filtered.map((row) => (
            <li key={row.id} className="admin-record">
              <div className="admin-record-head">
                <div>
                  <h2>{row.school_name}</h2>
                  <p className="admin-record-meta">
                    {row.school_location} · {row.contact_name} · <a href={`mailto:${row.email}`}>{row.email}</a>
                    {row.phone ? <> · <a href={`tel:${row.phone}`}>{row.phone}</a></> : null}
                    {row.phone ? <> · <a href={`https://wa.me/${String(row.phone).replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a></> : null}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span className={`admin-pill admin-pill-${row.status}`}>{row.status}</span>
                  {row.duplicate ? <span className="admin-pill" style={{ background: "#fff3cd", color: "#7a5a00" }}>Duplicate</span> : null}
                  {row.overdue ? <span className="admin-pill" style={{ background: "#fde8e8", color: "#9b1c1c" }}>Overdue</span> : null}
                  {row.needsAttention && !row.overdue ? <span className="admin-pill" style={{ background: "#e8f1ff", color: "#1b4b91" }}>Attention</span> : null}
                </div>
              </div>

              <p className="admin-record-meta">
                {when(row.created_at)} · {row.learner_count || "learner count not given"} · {row.programme_interest || "programme not specified"}
                {row.source ? <> · source: {row.source}</> : null}
                {row.assigned_to ? <> · assigned: {row.assigned_to}</> : null}
                {row.follow_up_at ? <> · follow-up: {when(row.follow_up_at)}</> : null}
              </p>

              {row.message ? <p className="admin-record-body">{row.message}</p> : null}

              <form action="/api/admin/enquiries" method="post" className="admin-enquiry-form">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="intent" value="update" />
                <div className="admin-enquiry-form-grid">
                  <label className="admin-field"><span>Status</span>
                    <select name="status" className="admin-input" defaultValue={row.status}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="admin-field"><span>Assigned to</span>
                    <input name="assigned_to" className="admin-input" defaultValue={row.assigned_to || ""} placeholder="Name or email" />
                  </label>
                  <label className="admin-field"><span>Follow-up</span>
                    <input type="datetime-local" name="follow_up_at" className="admin-input" defaultValue={dateInput(row.follow_up_at)} />
                  </label>
                </div>
                <label className="admin-field"><span>Admin note</span>
                  <textarea name="admin_note" className="admin-input" rows={3} defaultValue={row.admin_note || ""} placeholder="Notes, next step, call outcome..." />
                </label>
                <div className="admin-actions">
                  <button type="submit" className="admin-button">Save</button>
                </div>
              </form>

              <div className="admin-actions">
                <a
                  className="admin-button admin-button-quiet"
                  href={`/admin/ai?tool=email-draft-assistant&input=${encodeURIComponent(`Draft a professional follow-up for school enquiry #${row.id} (${row.school_name}, ${row.contact_name}, status: ${row.status}). Summarize context, recommend next action, and draft a short email/WhatsApp message. Use enquiry records if available.`)}`}
                >
                  Draft follow-up with AI
                </a>
                <form action="/api/admin/enquiries" method="post">
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="intent" value="delete" />
                  <button type="submit" className="admin-button admin-button-danger">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
