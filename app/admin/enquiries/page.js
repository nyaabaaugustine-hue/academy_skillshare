import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";
import { triageEnquiry, summarizeEnquiryQueue } from "../../../lib/enquiry-triage";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "scheduled", "enrolled", "closed", "lost"];
const PAGE_SIZE = 25;

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

function buildQuery(params) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.view && params.view !== "all") sp.set("view", params.view);
  if (params.sort && params.sort !== "priority") sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function AdminEnquiriesPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const q = norm(params?.q);
  const statusFilter = norm(params?.status);
  const view = norm(params?.view) || "all";
  const sort = norm(params?.sort) || "priority";
  const page = Math.max(1, parseInt(params?.page || "1", 10) || 1);

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
    const triage = triageEnquiry({ ...r, duplicate }, now);
    return { ...r, duplicate, overdue, stale, needsAttention, triage };
  });

  const filtered = enriched.filter((r) => {
    if (statusFilter && statusFilter !== "all" && norm(r.status) !== statusFilter) return false;
    if (view === "attention" && !r.needsAttention) return false;
    if (view === "urgent" && !["Urgent", "High"].includes(r.triage.priority)) return false;
    if (view === "overdue" && !r.overdue) return false;
    if (view === "duplicates" && !r.duplicate) return false;
    if (q) {
      const hay = [r.school_name, r.school_location, r.contact_name, r.email, r.phone, r.programme_interest, r.message, r.admin_note, r.assigned_to, r.source, r.status, r.triage.priority, r.triage.reasons.join(" ")].map(norm).join(" ");
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "newest") return new Date(b.created_at) - new Date(a.created_at);
    if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
    if (b.triage.score !== a.triage.score) return b.triage.score - a.triage.score;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
    urgent: enriched.filter((r) => r.triage.priority === "Urgent").length,
    high: enriched.filter((r) => r.triage.priority === "High").length,
  };

  const summary = summarizeEnquiryQueue(enriched, now);

  const saved = params?.saved;
  const errorParam = params?.error;

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>School enquiries</h1>
          <p>{counts.total} total · {counts.urgent} urgent · {counts.attention} need attention · {counts.duplicates} duplicate email(s)</p>
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
      {saved ? <p className="admin-alert admin-alert-ok" role="status">Saved{saved === "bulk" ? " (bulk update)" : ""}{saved === "deleted" ? " (deleted)" : ""}.</p> : null}
      {errorParam ? <p className="admin-alert admin-alert-error" role="alert">That change did not save. Check details and try again.</p> : null}

      <section className="admin-kpi-grid" aria-label="Enquiry KPIs">
        {[
          ["New", counts.new], ["Contacted", counts.contacted], ["Scheduled", counts.scheduled],
          ["Enrolled", counts.enrolled], ["Closed/Lost", counts.closed + counts.lost], ["Overdue follow-up", counts.overdue],
          ["Urgent", counts.urgent], ["High priority", counts.high],
        ].map(([label, value]) => (
          <div key={label} className="admin-kpi-card"><span className="admin-kpi-value">{value}</span><span className="admin-kpi-label">{label}</span></div>
        ))}
      </section>

      <section className="admin-panel" style={{ marginBottom: 20 }}>
        <h2>AI triage summary</h2>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#e5e7eb", background: "rgba(0,0,0,0.2)", padding: 12, borderRadius: 8, margin: "8px 0" }}>{summary.text}</pre>
        <div className="admin-actions">
          <a
            className="admin-button admin-button-quiet"
            href={`/admin/ai?tool=email-draft-assistant&input=${encodeURIComponent(`Triage the school enquiry queue. ${summary.text} Recommend the next 5 actions and draft follow-up messages for the urgent items.`)}`}
          >
            Draft triage with AI
          </a>
        </div>
      </section>

      <section className="admin-panel" style={{ marginBottom: 20 }}>
        <form method="get" className="admin-filter-bar">
          <input className="admin-input" type="search" name="q" defaultValue={params?.q || ""} placeholder="Search school, contact, email, note, priority..." />
          <select className="admin-input" name="status" defaultValue={statusFilter || "all"}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="admin-input" name="view" defaultValue={view}>
            <option value="all">All enquiries</option>
            <option value="attention">Needs attention</option>
            <option value="urgent">Urgent/High</option>
            <option value="overdue">Overdue follow-up</option>
            <option value="duplicates">Duplicates</option>
          </select>
          <select className="admin-input" name="sort" defaultValue={sort}>
            <option value="priority">Priority</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
          <button className="admin-button admin-button-quiet" type="submit">Filter</button>
          <a className="admin-button admin-button-quiet" href="/admin/enquiries">Reset</a>
        </form>
        <p className="admin-muted" style={{ marginTop: 8, fontSize: 12 }}>
          Triage is rule-based (status, age, overdue, duplicates, learner count, detail). AI follow-up drafts are available per enquiry.
        </p>
      </section>

      <section className="admin-panel" style={{ marginBottom: 20 }}>
        <h2>Bulk actions</h2>
        <p className="admin-muted" style={{ fontSize: 12, marginBottom: 8 }}>Tick enquiries in the table below, then use one of these actions. Use “Collect selected IDs” first.</p>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr" }}>
          <input id="bulk-ids" className="admin-input" name="ids" form="bulk-status-form" placeholder="Selected enquiry IDs (comma separated)" />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          <form id="bulk-status-form" action="/api/admin/enquiries" method="post" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <input type="hidden" name="intent" value="bulk_status" />
            <select name="status" className="admin-input" defaultValue="contacted">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="submit" className="admin-button admin-button-quiet">Set status</button>
          </form>
          <form action="/api/admin/enquiries" method="post" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <input type="hidden" name="intent" value="bulk_assign" />
            <input type="hidden" name="ids" className="bulk-ids-mirror" />
            <input name="assigned_to" className="admin-input" placeholder="Assign to" />
            <button type="submit" className="admin-button admin-button-quiet">Assign</button>
          </form>
          <form action="/api/admin/enquiries" method="post" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <input type="hidden" name="intent" value="bulk_followup" />
            <input type="hidden" name="ids" className="bulk-ids-mirror" />
            <input type="datetime-local" name="follow_up_at" className="admin-input" />
            <button type="submit" className="admin-button admin-button-quiet">Set follow-up</button>
          </form>
          <button
            type="button"
            className="admin-button admin-button-primary"
            onClick={() => {
              const ids = [...document.querySelectorAll(".enquiry-select:checked")].map((el) => el.getAttribute("data-id")).join(",");
              const primary = document.getElementById("bulk-ids");
              if (primary) primary.value = ids;
              document.querySelectorAll(".bulk-ids-mirror").forEach((el) => { el.value = ids; });
            }}
          >
            Collect selected IDs
          </button>
        </div>
      </section>

      {paged.length === 0 ? (
        <p className="admin-empty">No enquiries match this view.</p>
      ) : (
        <ul className="admin-list">
          {paged.map((row) => (
            <li key={row.id} className="admin-record">
              <div className="admin-record-head">
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <input type="checkbox" className="enquiry-select" data-id={row.id} style={{ marginTop: 6 }} />
                  <div>
                    <h2>#{row.id} {row.school_name}</h2>
                    <p className="admin-record-meta">
                      {row.school_location} · {row.contact_name} · <a href={`mailto:${row.email}`}>{row.email}</a>
                      {row.phone ? <> · <a href={`tel:${row.phone}`}>{row.phone}</a></> : null}
                      {row.phone ? <> · <a href={`https://wa.me/${String(row.phone).replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a></> : null}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span className={`admin-pill admin-pill-${row.status}`}>{row.status}</span>
                  <span className={`admin-pill ${row.triage.priority === "Urgent" ? "admin-pill-lost" : row.triage.priority === "High" ? "admin-pill-scheduled" : "admin-pill-new"}`}>{row.triage.priority} · {row.triage.score}</span>
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

              <p className="admin-muted" style={{ fontSize: 12, marginTop: 6 }}>
                Triage: {row.triage.reasons.join(", ")} · suggested status: {row.triage.suggestedStatus} · next follow-up in {row.triage.suggestedFollowUpDays} day(s)
                {row.triage.tags.length ? <> · tags: {row.triage.tags.join(", ")}</> : null}
              </p>

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
                  href={`/admin/ai?tool=email-draft-assistant&input=${encodeURIComponent(`Draft a professional follow-up for school enquiry #${row.id} (${row.school_name}, ${row.contact_name}, status: ${row.status}, priority: ${row.triage.priority}). Summarize context, recommend next action, and draft a short email/WhatsApp message.`)}`}
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

      {totalPages > 1 ? (
        <nav className="admin-actions" style={{ marginTop: 16, justifyContent: "center" }} aria-label="Pagination">
          {currentPage > 1 ? (
            <a className="admin-button admin-button-quiet" href={`/admin/enquiries${buildQuery({ q: params?.q, status: statusFilter || "all", view, sort, page: currentPage - 1 })}`}>Previous</a>
          ) : null}
          <span className="admin-muted" style={{ alignSelf: "center" }}>Page {currentPage} of {totalPages}</span>
          {currentPage < totalPages ? (
            <a className="admin-button admin-button-quiet" href={`/admin/enquiries${buildQuery({ q: params?.q, status: statusFilter || "all", view, sort, page: currentPage + 1 })}`}>Next</a>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
