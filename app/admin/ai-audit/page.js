import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

function fmt(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

function asMeta(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

export default async function AdminAiAuditPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const q = String(params?.q || "").trim().toLowerCase();
  const status = String(params?.status || "all").trim().toLowerCase();

  let rows = [];
  let unavailable = false;
  try {
    const sql = db();
    rows = await sql`
      select id, actor_user_id, action, entity_type, entity_id, metadata, created_at
      from audit_log
      where action = 'admin_ai.run'
      order by created_at desc
      limit 200
    `;
  } catch {
    unavailable = true;
  }

  const mapped = rows.map((r) => {
    const meta = asMeta(r.metadata);
    return {
      ...r,
      meta,
      ok: meta.ok === true,
      statusCode: meta.status ?? "",
      inputLength: meta.inputLength ?? "",
      recordsIncluded: Array.isArray(meta.recordsIncluded) ? meta.recordsIncluded : [],
      error: meta.error || "",
    };
  });

  const filtered = mapped.filter((r) => {
    if (status === "ok" && !r.ok) return false;
    if (status === "failed" && r.ok) return false;
    if (q) {
      const hay = [r.entity_id, r.actor_user_id, r.error, r.recordsIncluded.join(" "), JSON.stringify(r.meta)].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const okCount = mapped.filter((r) => r.ok).length;
  const failCount = mapped.length - okCount;

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>AI audit trail</h1>
          <p>{mapped.length} recent admin AI runs · {okCount} ok · {failCount} failed. Metadata only; prompts/records are not stored raw.</p>
        </div>
        <div className="admin-actions">
          <a className="admin-button admin-button-quiet" href="/admin/ai">Open AI tools</a>
        </div>
      </header>

      <section className="admin-panel">
        <form method="get" className="admin-filters" style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 180px auto auto" }}>
          <input className="admin-input" name="q" defaultValue={q} placeholder="Search tool, error, records..." />
          <select className="admin-input" name="status" defaultValue={status}>
            <option value="all">All statuses</option>
            <option value="ok">OK</option>
            <option value="failed">Failed</option>
          </select>
          <button className="admin-button admin-button-primary" type="submit">Filter</button>
          <a className="admin-button admin-button-quiet" href="/admin/ai-audit">Reset</a>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Runs ({filtered.length})</h2>
        {unavailable ? (
          <p className="admin-alert admin-alert-error" role="alert">Audit log unavailable. Ensure <code>audit_log</code> table exists (run <code>db/schema.sql</code> / migrations in Neon).</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty">No AI audit entries found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Tool</th>
                  <th>Status</th>
                  <th>Input</th>
                  <th>Records</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{fmt(r.created_at)}</td>
                    <td><code>{r.entity_id || "—"}</code></td>
                    <td>
                      <span className={`admin-pill admin-pill-${r.ok ? "new" : "lost"}`}>
                        {r.ok ? `OK${r.statusCode ? ` ${r.statusCode}` : ""}` : `Failed${r.statusCode ? ` ${r.statusCode}` : ""}`}
                      </span>
                    </td>
                    <td>{r.inputLength !== "" ? `${r.inputLength} chars` : "—"}</td>
                    <td style={{ maxWidth: 280 }}>{r.recordsIncluded.length ? r.recordsIncluded.join(", ") : "—"}</td>
                    <td style={{ maxWidth: 280, color: r.error ? "#f87171" : undefined }}>{r.error || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
