import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "Notifications | SkillBridge Academy",
  description: "Your SkillBridge notifications.",
  alternates: { canonical: "/notifications" },
};

export default function NotificationsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />NOTIFICATIONS</div>
            <h1>Your <em>updates.</em></h1>
            <p>Messages, reminders, and announcements from SkillBridge Academy.</p>
          </div>
        </section>
        <section className="section-wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
          <NotificationsClient />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
