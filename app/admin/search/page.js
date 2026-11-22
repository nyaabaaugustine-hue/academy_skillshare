import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

function norm(v) { return String(v || "").trim(); }
function lower(v) { return norm(v).toLowerCase(); }
function fmt(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

async function safe(label, fn) {
  try { return await fn(); } catch { return { __error: label }; }
}

export default async function AdminSearchPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const q = norm(params?.q);
  const ql = q.toLowerCase();
  const like = `%${q}%`;

  let results = { enquiries: [], learners: [], courses: [], trainings: [], showcase: [], awards: [], news: [], team: [] };
  let searched = false;

  if (q.length >= 2) {
    searched = true;
    const sql = db();
    const [enquiries, learners, courses, trainings, showcase, awards, news, team] = await Promise.all([
      safe("enquiries", () => sql`
        select id, school_name, contact_name, email, status, created_at
        from school_enquiries
        where school_name ilike ${like} or contact_name ilike ${like} or email ilike ${like} or programme_interest ilike ${like} or coalesce(message,'') ilike ${like}
        order by created_at desc limit 20
      `),
      safe("learners", () => sql`
        select id, name, email, school, stage, created_at
        from learners
        where name ilike ${like} or email ilike ${like} or coalesce(school,'') ilike ${like} or coalesce(stage,'') ilike ${like}
        order by created_at desc limit 20
      `),
      safe("courses", () => sql`
        select id, title, level, summary, published
        from lms_courses
        where title ilike ${like} or coalesce(summary,'') ilike ${like} or coalesce(level,'') ilike ${like}
        order by position asc, id asc limit 20
      `),
      safe("trainings", () => sql`
        select id, title, audience, level, status, date_label
        from upcoming_trainings
        where title ilike ${like} or coalesce(summary,'') ilike ${like} or coalesce(audience,'') ilike ${like}
        order by created_at desc limit 20
      `),
      safe("showcase", () => sql`
        select id, title, learner_alias, status, course_slug, created_at
        from project_showcase
        where title ilike ${like} or coalesce(description,'') ilike ${like} or coalesce(learner_alias,'') ilike ${like} or coalesce(course_slug,'') ilike ${like}
        order by created_at desc limit 20
      `),
      safe("awards", () => sql`
        select id, learner_name, learner_alias, award_title, award_type, status, issued_at
        from learner_awards
        where learner_name ilike ${like} or coalesce(learner_alias,'') ilike ${like} or award_title ilike ${like} or award_type ilike ${like}
        order by issued_at desc limit 20
      `),
      safe("news", () => sql`
        select id, title, category, published_at
        from news
        where title ilike ${like} or coalesce(excerpt,'') ilike ${like} or coalesce(category,'') ilike ${like}
        order by published_at desc limit 20
      `),
      safe("team", () => sql`
        select id, name, role, bio
        from team_members
        where name ilike ${like} or coalesce(role,'') ilike ${like} or coalesce(bio,'') ilike ${like}
        order by id asc limit 20
      `),
    ]);
    results = {
      enquiries: Array.isArray(enquiries) ? enquiries : [],
      learners: Array.isArray(learners) ? learners : [],
      courses: Array.isArray(courses) ? courses : [],
      trainings: Array.isArray(trainings) ? trainings : [],
      showcase: Array.isArray(showcase) ? showcase : [],
      awards: Array.isArray(awards) ? awards : [],
      news: Array.isArray(news) ? news : [],
      team: Array.isArray(team) ? team : [],
    };
  }

  const groups = [
    { key: "enquiries", label: "Enquiries", href: "/admin/enquiries", rows: results.enquiries, render: (r) => [r.school_name, `${r.contact_name} · ${r.email}`, r.status, fmt(r.created_at)] },
    { key: "learners", label: "Learners", href: "/admin/learners", rows: results.learners, render: (r) => [r.name, `${r.email}${r.school ? ` · ${r.school}` : ""}`, r.stage || "—", fmt(r.created_at)] },
    { key: "courses", label: "LMS courses", href: "/admin/lms", rows: results.courses, render: (r) => [r.title, r.summary || "—", r.level || "—", r.published ? "Published" : "Draft"] },
    { key: "trainings", label: "Trainings", href: "/admin/trainings", rows: results.trainings, render: (r) => [r.title, r.audience || "—", r.date_label || r.status || "—", r.level || "—"] },
    { key: "showcase", label: "Showcase", href: "/admin/showcase", rows: results.showcase, render: (r) => [r.title, r.learner_alias || "—", r.status || "—", fmt(r.created_at)] },
    { key: "awards", label: "Awards", href: "/admin/awards", rows: results.awards, render: (r) => [r.award_title, r.learner_alias || r.learner_name, r.award_type, fmt(r.issued_at)] },
    { key: "news", label: "News", href: "/admin/news", rows: results.news, render: (r) => [r.title, r.category || "—", fmt(r.published_at), "—"] },
    { key: "team", label: "Team", href: "/admin/team", rows: results.team, render: (r) => [r.name, r.role || "—", r.bio ? r.bio.slice(0, 80) : "—", "—"] },
  ];
  const total = groups.reduce((n, g) => n + g.rows.length, 0);

  return (
    <>
      <header className="admin-head">
        <div>
          <h1>Global search</h1>
          <p>Search enquiries, learners, courses, trainings, showcase, awards, news, and team.</p>
        </div>
      </header>

      <section className="admin-panel">
        <form method="get" style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr auto auto" }}>
          <input className="admin-input" name="q" defaultValue={q} placeholder="Search by name, email, title, status..." minLength={2} />
          <button className="admin-button admin-button-primary" type="submit">Search</button>
          <a className="admin-button admin-button-quiet" href="/admin/search">Clear</a>
        </form>
        <p className="admin-muted" style={{ marginTop: 8, fontSize: 12 }}>Minimum 2 characters. Read-only admin search across allowlisted fields.</p>
      </section>

      {searched ? (
        <section className="admin-panel">
          <h2>Results ({total})</h2>
          {total === 0 ? <p className="admin-empty">No matches for &ldquo;{q}&rdquo;.</p> : (
            <div style={{ display: "grid", gap: 16 }}>
              {groups.filter((g) => g.rows.length > 0).map((g) => (
                <div key={g.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <h3 style={{ margin: 0 }}>{g.label} <span className="admin-muted">({g.rows.length})</span></h3>
                    <a className="admin-button admin-button-quiet" href={g.href}>Open</a>
                  </div>
                  <div className="admin-table-wrap" style={{ marginTop: 8 }}>
                    <table className="admin-table">
                      <tbody>
                        {g.rows.map((r, i) => {
                          const cells = g.render(r);
                          return (
                            <tr key={r.id || i}>
                              {cells.map((c, j) => <td key={j} style={j === 0 ? { fontWeight: 600 } : undefined}>{c || "—"}</td>)}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}
