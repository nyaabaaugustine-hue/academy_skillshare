import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

function TrainingFields({ training }) {
  return (
    <div className="admin-grid">
      <label className="admin-field">
        <span>Type</span>
        <select name="type" defaultValue={training?.type ?? "TRAINING"}>
          <option value="TRAINING">Training</option>
          <option value="BOOTCAMP">Bootcamp</option>
        </select>
      </label>
      <label className="admin-field">
        <span>Order</span>
        <input name="position" type="number" defaultValue={training?.position ?? 0} min={0} max={999} />
      </label>
      <label className="admin-field admin-field-wide">
        <span>Title</span>
        <input name="title" defaultValue={training?.title ?? ""} required maxLength={180} />
      </label>
      <label className="admin-field">
        <span>Date label</span>
        <input name="date_label" defaultValue={training?.date_label ?? ""} maxLength={80} placeholder="June 2026" />
      </label>
      <label className="admin-field">
        <span>Duration</span>
        <input name="duration" defaultValue={training?.duration ?? ""} maxLength={80} placeholder="4 weeks" />
      </label>
      <label className="admin-field">
        <span>Format</span>
        <input name="format" defaultValue={training?.format ?? ""} maxLength={120} placeholder="Hybrid" />
      </label>
      <label className="admin-field admin-field-wide">
        <span>Image URL</span>
        <input name="image" defaultValue={training?.image ?? ""} maxLength={1200} />
      </label>
      <label className="admin-field admin-field-wide">
        <span>Description</span>
        <textarea name="description" rows={3} defaultValue={training?.description ?? ""} maxLength={1200} />
      </label>
      <label className="admin-check">
        <input type="checkbox" name="published" defaultChecked={training?.published ?? true} />
        <span>Show on the website</span>
      </label>
    </div>
  );
}

export default async function AdminTrainingsPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;

  let trainings = [];
  let loadError = false;
  try {
    trainings = await db()`
      select id, type, title, date_label, duration, format, image, description, position, published, created_at
      from upcoming_trainings
      order by position asc, id asc
    `;
  } catch {
    loadError = true;
  }

  return (
    <>
      <header className="admin-head">
        <h1>Upcoming trainings &amp; bootcamps</h1>
        <p>Manage the trainings and bootcamps shown on the homepage upcoming section.</p>
      </header>

      {params?.saved ? <p className="admin-alert admin-alert-ok" role="status">Saved.</p> : null}
      {params?.error ? (
        <p className="admin-alert admin-alert-error" role="alert">That did not save. Title is required.</p>
      ) : null}
      {loadError ? (
        <p className="admin-alert admin-alert-error" role="alert">
          Could not load trainings. Make sure the <code>upcoming_trainings</code> table exists in Neon.
        </p>
      ) : null}

      <section className="admin-panel">
        <h2>Add training or bootcamp</h2>
        <form action="/api/admin/trainings" method="post" className="admin-form">
          <input type="hidden" name="intent" value="create" />
          <TrainingFields />
          <button type="submit" className="admin-button admin-button-primary">Add training</button>
        </form>
      </section>

      <section className="admin-panel">
        <h2>Current trainings ({trainings.length})</h2>
        {trainings.length === 0 ? (
          <p className="admin-empty">No trainings yet. Add one above, or the homepage will use the built-in fallback.</p>
        ) : (
          <ul className="admin-list">
            {trainings.map((t) => (
              <li key={t.id} className="admin-record">
                <div className="admin-record-head">
                  <div className="admin-person">
                    {t.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.image} alt="" width={44} height={44} />
                    ) : null}
                    <div>
                      <h3>{t.title}</h3>
                      <p className="admin-record-meta">{t.type} · {t.date_label || "Date TBA"} · {t.format || "Format TBA"}</p>
                    </div>
                  </div>
                  <span className={`admin-pill admin-pill-${t.published ? "new" : "closed"}`}>
                    {t.published ? "published" : "hidden"}
                  </span>
                </div>

                <details className="admin-details">
                  <summary>Edit details</summary>
                  <form action="/api/admin/trainings" method="post" className="admin-form">
                    <input type="hidden" name="intent" value="update" />
                    <input type="hidden" name="id" value={t.id} />
                    <TrainingFields training={t} />
                    <button type="submit" className="admin-button admin-button-primary">Save changes</button>
                  </form>
                </details>

                <form action="/api/admin/trainings" method="post" className="admin-actions">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="admin-button admin-button-danger">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
