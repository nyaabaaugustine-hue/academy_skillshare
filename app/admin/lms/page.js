import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
};

const dayLabel = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "" : DAY.format(date);
};

function CourseFields({ course }) {
  return (
    <div className="admin-grid">
      <label className="admin-field admin-field-wide">
        <span>Course title</span>
        <input name="title" defaultValue={course?.title ?? ""} required maxLength={180} />
      </label>
      <label className="admin-field">
        <span>Level or age band</span>
        <input
          name="level"
          defaultValue={course?.level ?? ""}
          maxLength={80}
          placeholder="e.g. Ages 12–18 · Beginner"
        />
      </label>
      <label className="admin-field">
        <span>Duration</span>
        <input
          name="duration"
          defaultValue={course?.duration ?? ""}
          maxLength={80}
          placeholder="e.g. 12 weeks"
        />
      </label>
      <label className="admin-field">
        <span>Start date</span>
        <input
          name="start_date"
          type="date"
          defaultValue={dateInput(course?.start_date)}
        />
      </label>
      <label className="admin-field">
        <span>Format</span>
        <input
          name="format"
          defaultValue={course?.format ?? ""}
          maxLength={120}
          placeholder="e.g. Weekly · online + in person"
        />
      </label>
      <label className="admin-field admin-field-wide">
        <span>Summary</span>
        <textarea
          name="summary"
          rows={3}
          defaultValue={course?.summary ?? ""}
          maxLength={600}
          placeholder="The short paragraph shown on the homepage spotlight."
        />
      </label>
      <label className="admin-field admin-field-wide">
        <span>Topics (comma separated)</span>
        <input name="topics" defaultValue={course?.topics ?? ""} maxLength={600} />
      </label>
      <label className="admin-field admin-field-wide">
        <span>Outcomes (comma separated)</span>
        <input
          name="outcomes"
          defaultValue={course?.outcomes ?? ""}
          maxLength={900}
          placeholder="What learners will be able to do by the end"
        />
      </label>
      <label className="admin-field admin-field-wide">
        <span>Cover image URL</span>
        <input
          name="image"
          defaultValue={course?.image ?? ""}
          maxLength={1200}
          placeholder="/images/python-beginners.jpg or https://…"
        />
      </label>
      <label className="admin-field admin-field-wide">
        <span>Course link</span>
        <input name="link" defaultValue={course?.link ?? ""} maxLength={1200} />
      </label>
      <label className="admin-field">
        <span>Call-to-action label</span>
        <input
          name="cta_label"
          defaultValue={course?.cta_label ?? ""}
          maxLength={80}
          placeholder="Register on the LMS"
        />
      </label>
      <label className="admin-field">
        <span>Order</span>
        <input
          name="position"
          type="number"
          defaultValue={course?.position ?? 0}
          min={0}
          max={999}
        />
      </label>
      <label className="admin-check">
        <input type="checkbox" name="featured" defaultChecked={course?.featured ?? false} />
        <span>Feature on the homepage</span>
      </label>
      <label className="admin-check">
        <input type="checkbox" name="published" defaultChecked={course?.published ?? true} />
        <span>Show in the LMS catalogue</span>
      </label>
    </div>
  );
}

function savedMessage(saved) {
  if (saved === "created") return "Course added. The homepage spotlight is updated.";
  if (saved === "updated") return "Course updated.";
  if (saved === "deleted") return "Course deleted.";
  if (saved === "status") return "Visibility updated.";
  if (saved === "spotlight") return "Homepage spotlight updated.";
  return "Saved.";
}

export default async function AdminLmsPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;

  let schemaReady = true;
  let courses;

  try {
    courses = await db()`
      select id, title, level, summary, topics, duration, link, start_date,
             featured, image, outcomes, format, cta_label, position, published
      from lms_courses
      order by position asc, id asc
    `;
  } catch {
    schemaReady = false;
    courses = await db()`
      select id, title, level, summary, topics, duration, link, position, published
      from lms_courses
      order by position asc, id asc
    `;
  }

  const featured = courses.find((course) => course.featured);
  const error = params?.error;

  return (
    <>
      <header className="admin-head">
        <h1>LMS courses</h1>
        <p>The course catalogue learners see in the learning management system.</p>
      </header>

      {params?.saved ? (
        <p className="admin-alert admin-alert-ok" role="status">
          {savedMessage(params.saved)}
        </p>
      ) : null}

      {error === "required" ? (
        <p className="admin-alert admin-alert-error" role="alert">
          A course title is required.
        </p>
      ) : null}
      {error === "missing" ? (
        <p className="admin-alert admin-alert-error" role="alert">
          That course could not be found. Refresh and try again.
        </p>
      ) : null}
      {error === "schema" || !schemaReady ? (
        <p className="admin-alert admin-alert-error" role="alert">
          The homepage spotlight columns are missing from the database. Run{" "}
          <code>npm run db:install</code> (or apply <code>db/schema.sql</code> in the
          Neon SQL editor), then reload this page.
        </p>
      ) : null}
      {error === "save" ? (
        <p className="admin-alert admin-alert-error" role="alert">
          That did not save. Check the fields and try again.
        </p>
      ) : null}

      <section className="admin-spotlight-note" aria-label="Homepage spotlight">
        <span className="admin-spotlight-star" aria-hidden="true">
          ★
        </span>
        <div>
          <strong>Homepage spotlight</strong>
          <p>
            One published course can be featured on the public homepage. It appears
            with its cover image, start date, outcomes and links to the learner app.
          </p>
          {featured ? (
            <small>
              Currently featuring: <b>{featured.title}</b>
              {featured.start_date ? ` · starts ${dayLabel(featured.start_date)}` : ""}
            </small>
          ) : (
            <small>No course is featured yet. Choose one below.</small>
          )}
        </div>
      </section>

      <section className="admin-panel" id="add-course">
        <div className="admin-panel-head">
          <div>
            <h2>Add a course</h2>
            <p className="admin-panel-sub">
              Add the full detail now and mark it as featured to update the homepage.
            </p>
          </div>
        </div>
        <form action="/api/admin/lms" method="post" className="admin-form">
          <input type="hidden" name="intent" value="create" />
          <CourseFields />
          <button type="submit" className="admin-button admin-button-primary">
            Add course
          </button>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Courses ({courses.length})</h2>

        {courses.length === 0 ? (
          <p className="admin-empty">No courses yet.</p>
        ) : (
          <ul className="admin-list">
            {courses.map((course) => (
              <li key={course.id} className="admin-record">
                <div className="admin-record-head">
                  <div>
                    <h3>{course.title}</h3>
                    <p className="admin-record-meta">
                      {[
                        course.start_date ? `Starts ${dayLabel(course.start_date)}` : "",
                        course.format,
                        course.duration,
                        course.level,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No course details set"}
                    </p>
                  </div>
                  <div className="admin-pill-group">
                    {course.featured ? (
                      <span className="admin-pill admin-pill-featured">featured</span>
                    ) : null}
                    <span
                      className={`admin-pill admin-pill-${
                        course.published ? "new" : "closed"
                      }`}
                    >
                      {course.published ? "published" : "hidden"}
                    </span>
                  </div>
                </div>

                {course.summary ? (
                  <p className="admin-record-body">{course.summary}</p>
                ) : null}

                <details className="admin-details">
                  <summary>Edit course details</summary>
                  <form action="/api/admin/lms" method="post" className="admin-form">
                    <input type="hidden" name="intent" value="update" />
                    <input type="hidden" name="id" value={course.id} />
                    <CourseFields course={course} />
                    <button type="submit" className="admin-button admin-button-primary">
                      Save changes
                    </button>
                  </form>
                </details>

                <div className="admin-actions">
                  <form action="/api/admin/lms" method="post">
                    <input type="hidden" name="id" value={course.id} />
                    <input
                      type="hidden"
                      name="intent"
                      value={course.published ? "unpublish" : "publish"}
                    />
                    <button type="submit" className="admin-button admin-button-quiet">
                      {course.published ? "Hide from LMS" : "Publish to LMS"}
                    </button>
                  </form>
                  <form action="/api/admin/lms" method="post">
                    <input type="hidden" name="id" value={course.id} />
                    <input
                      type="hidden"
                      name="intent"
                      value={course.featured ? "unfeature" : "feature"}
                    />
                    <button type="submit" className="admin-button admin-button-quiet">
                      {course.featured ? "Remove spotlight" : "Feature on homepage"}
                    </button>
                  </form>
                  <form action="/api/admin/lms" method="post">
                    <input type="hidden" name="id" value={course.id} />
                    <input type="hidden" name="intent" value="delete" />
                    <button type="submit" className="admin-button admin-button-danger">
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
