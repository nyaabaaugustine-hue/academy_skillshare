import { requireAdmin } from "../../lib/admin-auth";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Africa/Accra",
});

const TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Accra",
});

const LONG_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Accra",
});

const when = (value) => {
  const date = new Date(value);
  return `${DATE.format(date)} · ${TIME.format(date)}`;
};

const day = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return DATE.format(date);
};

const stageLabels = {
  signed_up: "Signed up",
  learning: "Learning",
  paused: "Paused",
  completed: "Completed",
};

export default async function AdminOverviewPage() {
  await requireAdmin();

  let sql;
  try {
    sql = db();
  } catch {
    return (
      <>
        <header className="admin-head admin-head-dash">
          <div>
            <span className="admin-head-kicker">Dashboard</span>
            <h1>Database connection needed</h1>
            <p>
              The admin dashboard is ready, but this environment does not have a
              <code> DATABASE_URL</code> configured yet.
            </p>
          </div>
        </header>
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Finish setup</h2>
              <p className="admin-panel-sub">
                Add a pooled Neon connection string to <code>.env.local</code> and run{" "}
                <code>npm run db:install</code> to create the dashboard tables.
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  const [counts] = await sql`
    select
      (select count(*)::int from school_enquiries) as enquiries,
      (select count(*)::int from school_enquiries where status = 'new') as new_enquiries,
      (select count(*)::int from school_enquiries
        where created_at > now() - interval '7 days') as enquiries_this_week,
      (select count(*)::int from team_members) as team,
      (select count(*)::int from news_posts) as news,
      (select count(*)::int from news_posts where published = true) as published_news,
      (select count(*)::int from learners) as learners,
      (select count(*)::int from learners where stage = 'learning') as learning,
      (select count(*)::int from learners where stage = 'signed_up') as signed_up,
      (select count(*)::int from learners
        where created_at > now() - interval '7 days') as learners_this_week,
      (select count(*)::int from lms_courses) as courses,
      (select count(*)::int from lms_courses where published = true) as published_courses,
      (select count(*)::int from pwa_apps) as apps,
      (select count(*)::int from pwa_apps where published = true) as published_apps
  `;

  let platform = { students: 0, suspended: 0 };
  try {
    const rows = await sql`
      select
        (select count(*)::int from neon_auth."user") as students,
        (select count(*)::int from app_users where status <> 'active') as suspended
    `;
    platform = rows[0] ?? platform;
  } catch {
    // Neon Auth not enabled on this database yet; the card shows zeroes.
  }

  const [recent, stageRows, activity] = await Promise.all([
    sql`
      select id, school_name, contact_name, email, learner_count, status, created_at
      from school_enquiries
      order by created_at desc
      limit 4
    `,
    sql`
      select stage, count(*)::int as total
      from learners
      group by stage
    `,
    sql`
      select 'enquiry' as kind, id, school_name as title,
             contact_name as subtitle, status as tag, created_at
      from school_enquiries
      union all
      select 'learner' as kind, id, full_name as title,
             programme as subtitle, stage as tag, created_at
      from learners
      order by created_at desc
      limit 7
    `,
  ]);

  let featuredCourses = 0;
  try {
    const [row] = await sql`
      select count(*)::int as total
      from lms_courses
      where published = true and featured = true
    `;
    featuredCourses = row?.total ?? 0;
  } catch {
    // The featured columns arrive with the latest schema; hide the count until then.
  }

  let courses = [];
  try {
    courses = await sql`
      select id, title, level, duration, start_date, featured, published
      from lms_courses
      where published = true
      order by featured desc, start_date asc nulls last, position asc, id asc
      limit 5
    `;
  } catch {
    courses = await sql`
      select id, title, level, duration, published
      from lms_courses
      where published = true
      order by position asc, id asc
      limit 5
    `;
  }

  const stages = Object.fromEntries(stageRows.map((row) => [row.stage, row.total]));
  const pipelineTotal = counts.learners || 0;
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Accra",
    }).format(new Date()),
  );
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats = [
    {
      label: "New enquiries",
      value: counts.new_enquiries,
      meta: `${counts.enquiries} total · +${counts.enquiries_this_week} this week`,
      href: "/admin/enquiries",
      tone: "blue",
      icon: "✉",
    },
    {
      label: "Active learners",
      value: counts.learning,
      meta: `${pipelineTotal} in the pipeline · ${counts.signed_up} waiting`,
      href: "/admin/learners",
      tone: "green",
      icon: "◉",
    },
    {
      label: "LMS students",
      value: platform.students,
      meta: `${platform.suspended} suspended · app accounts`,
      href: "/admin/students",
      tone: "purple",
      icon: "◎",
    },
    {
      label: "Published courses",
      value: counts.published_courses,
      meta: `${featuredCourses} featured on the homepage`,
      href: "/admin/lms",
      tone: "amber",
      icon: "▷",
    },
    {
      label: "Published news",
      value: counts.published_news,
      meta: `${counts.news} written · ${counts.team} team profiles`,
      href: "/admin/news",
      tone: "teal",
      icon: "▤",
    },
    {
      label: "PWA apps",
      value: counts.published_apps,
      meta: `${counts.apps} in the app directory`,
      href: "/admin/apps",
      tone: "slate",
      icon: "▣",
    },
  ];

  const quickActions = [
    {
      href: "/admin/lms#add-course",
      title: "Spotlight a course",
      text: "Add a course or mark one as featured on the homepage.",
      icon: "▷",
    },
    {
      href: "/admin/enquiries",
      title: "Review enquiries",
      text: `${counts.new_enquiries} new ${
        counts.new_enquiries === 1 ? "enquiry is" : "enquiries are"
      } waiting for a reply.`,
      icon: "✉",
    },
    {
      href: "/admin/learners",
      title: "Move learners forward",
      text: `${counts.signed_up} signed up and waiting to start.`,
      icon: "◉",
    },
    {
      href: "/admin/news",
      title: "Publish a story",
      text: "Keep the news and impact page current.",
      icon: "▤",
    },
  ];

  return (
    <>
      <header className="admin-head admin-head-dash">
        <div>
          <span className="admin-head-kicker">{greeting}</span>
          <h1>Dashboard overview</h1>
          <p>Here is what needs attention across SkillBridge today.</p>
        </div>
        <div className="admin-head-actions">
          <span className="admin-head-date">{LONG_DATE.format(new Date())}</span>
          <a className="admin-button admin-button-primary" href="/admin/lms#add-course">
            Add a course
          </a>
        </div>
      </header>

      <section className="admin-stats" aria-label="Key numbers">
        {stats.map((stat) => (
          <a
            key={stat.label}
            className={`admin-stat admin-stat-${stat.tone}`}
            href={stat.href}
          >
            <span className="admin-stat-top">
              <span className="admin-stat-icon" aria-hidden="true">
                {stat.icon}
              </span>
              <span className="admin-stat-label">{stat.label}</span>
            </span>
            <strong>{stat.value}</strong>
            <small>{stat.meta}</small>
          </a>
        ))}
      </section>

      <div className="admin-dash-split">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Latest school enquiries</h2>
              <p className="admin-panel-sub">Newest conversations from the public site.</p>
            </div>
            <a className="admin-text-link" href="/admin/enquiries">
              View all →
            </a>
          </div>

          {recent.length === 0 ? (
            <div className="admin-empty-state">
              <span aria-hidden="true">✉</span>
              <p className="admin-empty">
                No enquiries yet. Submissions from the school form on the homepage
                land here.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">School</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Learners</th>
                    <th scope="col">Received</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.id}>
                      <td>{row.school_name}</td>
                      <td>
                        {row.contact_name}
                        <small>{row.email}</small>
                      </td>
                      <td>{row.learner_count || "—"}</td>
                      <td>{when(row.created_at)}</td>
                      <td>
                        <span className={`admin-pill admin-pill-${row.status}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Quick actions</h2>
              <p className="admin-panel-sub">The jobs that move the work forward.</p>
            </div>
          </div>
          <div className="admin-quick-grid">
            {quickActions.map((action) => (
              <a className="admin-quick" href={action.href} key={action.title}>
                <span className="admin-quick-icon" aria-hidden="true">
                  {action.icon}
                </span>
                <strong>{action.title}</strong>
                <small>{action.text}</small>
                <span className="admin-quick-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="admin-dash-split admin-dash-split-even">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Learner pipeline</h2>
              <p className="admin-panel-sub">
                {counts.learners_this_week} new{" "}
                {counts.learners_this_week === 1 ? "signup" : "signups"} in the last
                7 days.
              </p>
            </div>
            <a className="admin-text-link" href="/admin/learners">
              Manage →
            </a>
          </div>

          {pipelineTotal === 0 ? (
            <div className="admin-empty-state">
              <span aria-hidden="true">◉</span>
              <p className="admin-empty">
                No learners yet. Enrolments from the homepage and LMS create them
                automatically.
              </p>
            </div>
          ) : (
            <ul className="admin-pipeline">
              {["signed_up", "learning", "paused", "completed"].map((stage) => {
                const total = stages[stage] ?? 0;
                const percent = pipelineTotal ? Math.round((total / pipelineTotal) * 100) : 0;
                return (
                  <li key={stage}>
                    <div className="admin-pipeline-head">
                      <span>{stageLabels[stage]}</span>
                      <strong>{total}</strong>
                    </div>
                    <div className="admin-progress" aria-hidden="true">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <small>{percent}% of the pipeline</small>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Course spotlight</h2>
              <p className="admin-panel-sub">
                What learners see first on the homepage.
              </p>
            </div>
            <a className="admin-text-link" href="/admin/lms">
              Manage courses →
            </a>
          </div>

          {courses.length === 0 ? (
            <div className="admin-empty-state">
              <span aria-hidden="true">▷</span>
              <p className="admin-empty">
                No published courses yet. Add one and mark it as featured.
              </p>
              <a className="admin-button" href="/admin/lms#add-course">
                Add the first course
              </a>
            </div>
          ) : (
            <ul className="admin-course-list">
              {courses.map((course) => (
                <li key={course.id}>
                  <div>
                    <strong>{course.title}</strong>
                    <small>
                      {[
                        course.start_date ? `Starts ${day(course.start_date)}` : "Start date not set",
                        course.duration,
                        course.level,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>
                  <span
                    className={`admin-pill ${
                      course.featured ? "admin-pill-featured" : "admin-pill-new"
                    }`}
                  >
                    {course.featured ? "featured" : "published"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>Recent activity</h2>
            <p className="admin-panel-sub">Enquiries and learner signups, newest first.</p>
          </div>
        </div>

        {activity.length === 0 ? (
          <p className="admin-empty">Nothing has happened yet.</p>
        ) : (
          <ul className="admin-activity">
            {activity.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <span
                  className={`admin-activity-icon admin-activity-icon-${item.kind}`}
                  aria-hidden="true"
                >
                  {item.kind === "enquiry" ? "✉" : "◉"}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <small>
                    {item.kind === "enquiry" ? "School enquiry" : "Learner signup"} ·{" "}
                    {item.subtitle || "No contact name"}
                  </small>
                </div>
                <time dateTime={new Date(item.created_at).toISOString()}>
                  {when(item.created_at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
