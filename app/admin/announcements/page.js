import { requireAdmin } from "../../../lib/admin-auth";
import { db } from "../../../lib/db";
import { fcmEnabled } from "../../../lib/server/fcm";
import AnnouncementForm from "./announcement-form";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  const announcements = await db()`
    select id, title, body, audience, created_at
    from public.announcements
    order by created_at desc, id desc
    limit 50
  `;
  const pushEnabled = fcmEnabled();

  return (
    <>
      <header className="admin-head">
        <h1>Announcements</h1>
        <p>
          One-way messages to every learner&apos;s in-app inbox. Push delivery is{" "}
          {pushEnabled ? "enabled" : "not configured (inbox delivery still works)"}.
        </p>
      </header>

      <AnnouncementForm />

      <section className="admin-panel">
        <h2>Recent announcements ({announcements.length})</h2>
        {announcements.length === 0 ? (
          <p className="admin-empty">No announcements yet.</p>
        ) : (
          <ul className="admin-list">
            {announcements.map((item) => (
              <li key={item.id} className="admin-record">
                <div className="admin-record-head">
                  <h3>{item.title}</h3>
                  <p className="admin-record-meta">
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(item.created_at))}
                  </p>
                </div>
                <p className="admin-record-body">{item.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
