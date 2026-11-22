import { getAdminSession } from "../../lib/admin-auth";
import AdminNav from "./admin-nav";
import "./admin.css";

export const metadata = {
  title: "SkillBridge admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  const session = await getAdminSession();

  if (!session) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-shell">
          <aside className="admin-gate-brand">
            <span className="admin-gate-logo" aria-hidden="true">
              S
            </span>
            <span className="admin-eyebrow">SKILLBRIDGE</span>
            <h2>Staff console</h2>
            <p>
              One workspace for school enquiries, learners, the course catalogue
              and everything the public site shows.
            </p>
            <ul>
              <li>Review and respond to new enquiries</li>
              <li>Track learners through the pipeline</li>
              <li>Publish courses, news and team profiles</li>
            </ul>
            <small>Authorised staff only · 🇧🇪 Belgium · 🇺🇸 USA · 🇬🇭 Ghana</small>
          </aside>
          <div className="admin-gate-card">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <a className="admin-brand" href="/admin" aria-label="SkillBridge admin home">
          <span className="admin-brand-mark" aria-hidden="true">
            S
          </span>
          <span>
            <strong>SkillBridge</strong>
            <small>Staff console</small>
          </span>
        </a>

        <AdminNav />

        <div className="admin-side-foot">
          <div className="admin-side-account">
            <span>Signed in as</span>
            <strong title={session.email}>{session.email || "Administrator"}</strong>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            View public site ↗
          </a>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="admin-link-button">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
