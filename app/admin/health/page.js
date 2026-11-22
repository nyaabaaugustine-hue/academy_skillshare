import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";
import { cloudflareConfig } from "../../../lib/cloudflare/config";
import { cloudflarePublicConfig } from "../../../lib/cloudflare/public-config";

export const dynamic = "force-dynamic";

async function check(label, fn) {
  const start = Date.now();
  try {
    const value = await fn();
    return { label, ok: true, ms: Date.now() - start, value };
  } catch (e) {
    return { label, ok: false, ms: Date.now() - start, value: e?.message || "failed" };
  }
}

export default async function AdminHealthPage() {
  await requireAdmin();

  const cf = cloudflareConfig();
  const pub = cloudflarePublicConfig();
  const checks = await Promise.all([
    check("Database connection", async () => {
      const sql = db();
      const r = await sql`select 1 as ok`;
      return r?.[0]?.ok === 1 ? "connected" : "unexpected";
    }),
    check("audit_log table", async () => {
      const sql = db();
      const r = await sql`select count(*)::int as c from audit_log`;
      return `${r?.[0]?.c ?? 0} rows`;
    }),
    check("school_enquiries table", async () => {
      const sql = db();
      const r = await sql`select count(*)::int as c from school_enquiries`;
      return `${r?.[0]?.c ?? 0} rows`;
    }),
    check("learners table", async () => {
      const sql = db();
      const r = await sql`select count(*)::int as c from learners`;
      return `${r?.[0]?.c ?? 0} rows`;
    }),
  ]);

  const env = [
    { name: "TUTOR_WORKER_URL", ok: !!(process.env.TUTOR_WORKER_URL || "").trim() },
    { name: "TUTOR_SERVICE_AUTHORIZATION", ok: !!(process.env.TUTOR_SERVICE_AUTHORIZATION || "").trim() },
    { name: "CLOUDFLARE_TURNSTILE_SITE_KEY", ok: !!(pub.turnstileSiteKey || "").trim() },
    { name: "CLOUDFLARE_TURNSTILE_SECRET_KEY", ok: !!cf.turnstile.secretKey },
    { name: "TURNSTILE_HOSTNAMES", ok: !!(process.env.TURNSTILE_HOSTNAMES || process.env.CLOUDFLARE_TURNSTILE_HOSTNAMES || "").trim() },
    { name: "SLACK_WEBHOOK_URL", ok: !!(process.env.SLACK_WEBHOOK_URL || "").trim() },
    { name: "NEON_AUTH_BASE_URL", ok: !!(process.env.NEON_AUTH_BASE_URL || "").trim() },
    { name: "NEON_AUTH_COOKIE_SECRET", ok: !!(process.env.NEON_AUTH_COOKIE_SECRET || "").trim() },
    { name: "DATABASE_URL / POSTGRES_URL", ok: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.STORAGE_URL || "").trim() },
  ];

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>System health</h1>
          <p>Server-side checks for admin diagnostics. Values are redacted; no secrets shown.</p>
        </div>
      </header>

      <section className="admin-panel">
        <h2>Runtime checks</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Check</th><th>Status</th><th>Latency</th><th>Detail</th></tr></thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.label}>
                  <td>{c.label}</td>
                  <td><span className={`admin-pill admin-pill-${c.ok ? "new" : "lost"}`}>{c.ok ? "OK" : "Fail"}</span></td>
                  <td>{c.ms}ms</td>
                  <td style={{ color: c.ok ? undefined : "#f87171" }}>{String(c.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <h2>Environment configuration</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Variable</th><th>Configured</th></tr></thead>
            <tbody>
              {env.map((e) => (
                <tr key={e.name}>
                  <td><code>{e.name}</code></td>
                  <td><span className={`admin-pill admin-pill-${e.ok ? "new" : "closed"}`}>{e.ok ? "Set" : "Missing"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="admin-muted" style={{ marginTop: 10, fontSize: 12 }}>
          Worker URL: <code>{cf.workerUrl || "not set"}</code>
        </p>
      </section>
    </>
  );
}
