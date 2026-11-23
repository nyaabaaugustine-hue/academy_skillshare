import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import AccountClient from "./AccountClient";

export const metadata = {
  title: "My account | SkillBridge Academy",
  description: "Manage your SkillBridge profile, learning preferences, security, and sessions.",
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero account-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />MY ACCOUNT</div>
            <h1>Manage your <em>account.</em></h1>
            <p>Profile, learning preferences, security, and active sessions in one place.</p>
          </div>
        </section>
        <section className="section-wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
          <AccountClient />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
