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

function daysAgo(value) {
  if (!value) return null;
  return Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AdminAtRiskPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const q = String(params?.q || "").trim().toLowerCase();

  let rows = [];
  let unavailable = false;
  try {
    const sql = db();
    rows = await sql`
      select le.id, le.name, le.score, le.course_slug, le.steps_completed, le.practices_completed,
             le.updated_at,
             cp.percent, cp.completed_lessons, cp.total_lessons, cp.updated_at as progress_updated_at
      from leaderboard_entries le
      left join course_progress cp on cp.user_id = le.id
      order by le.score asc, le.updated_at asc
      limit 200
    `;
  } catch {
    unavailable = true;
  }

  const enriched = rows.map((r) => {
    const progressUpdated = r.progress_updated_at ? new Date(r.progress_updated_at).getTime() : null;
    const staleDays = progressUpdated ? daysAgo(r.progress_updated_at) : null;
    const stalled = staleDays !== null && staleDays > 7;
    const lowScore = Number(r.score || 0) < 40;
    const lowProgress = Number(r.percent || 0) < 30;
    const atRisk = stalled || lowScore || lowProgress;
    let reason = [];
    if (stalled) reason.push(`no activity for ${staleDays} days`);
    if (lowScore) reason.push(`score ${r.score}`);
    if (lowProgress) reason.push(`progress ${r.percent}%`);
    return { ...r, atRisk, stalled, lowScore, lowProgress, reason: reason.join(", ") || "—", staleDays };
  });

  const filtered = enriched.filter((r) => {
    if (!r.atRisk) return false;
    if (q) {
      const hay = [r.name, r.course_slug, r.reason].join(" ").toLowerCase();
      return hay.includes(q);
    }
    return true;
  });

  const atRiskCount = enriched.filter((r) => r.atRisk).length;

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>At-risk learners</h1>
          <p>{atRiskCount} of {enriched.length} tracked learners may need early intervention.</p>
        </div>
        <div className="admin-actions">
          <a className="admin-button admin-button-quiet" href="/admin/ai">Draft intervention with AI</a>
        </div>
      </header>

      <section className="admin-panel">
        <form method="get" className="admin-filters" style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto auto" }}>
          <input className="admin-input" name="q" defaultValue={q} placeholder="Search name, course, reason..." />
          <button className="admin-button admin-button-primary" type="submit">Filter</button>
          <a className="admin-button admin-button-quiet" href="/admin/at-risk">Reset</a>
        </form>
        <p className="admin-muted" style={{ marginTop: 8, fontSize: 12 }}>
          A learner is flagged at-risk when they have no activity for 7+ days, a score below 40, or course progress below 30%.
        </p>
      </section>

      <section className="admin-panel">
        <h2>Flagged learners ({filtered.length})</h2>
        {unavailable ? (
          <p className="admin-alert admin-alert-error" role="alert">Learner data unavailable. Ensure leaderboard_entries and course_progress tables exist.</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty">No at-risk learners found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Learner</th>
                  <th>Course</th>
                  <th>Score</th>
                  <th>Progress</th>
                  <th>Last activity</th>
                  <th>Why flagged</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td><b>{r.name}</b></td>
                    <td>{r.course_slug || "—"}</td>
                    <td>{r.score}</td>
                    <td>{r.percent !== null ? `${r.percent}%` : "—"}</td>
                    <td>{fmt(r.progress_updated_at || r.updated_at)}</td>
                    <td style={{ color: "#9b1c1c", fontSize: 12 }}>{r.reason}</td>
                    <td>
                      <a className="admin-button admin-button-quiet" href={`/admin/ai?tool=intervention-planner&input=${encodeURIComponent(`Draft an intervention plan for learner "${r.name}" (${r.course_slug}). Score: ${r.score}, progress: ${r.percent}%, last activity: ${fmt(r.progress_updated_at || r.updated_at)}. Reason: ${r.reason}. Suggest supportive next steps and guardian outreach draft.`)}`}>
                        Draft plan
                      </a>
                    </td>
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
