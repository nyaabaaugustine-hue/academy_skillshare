import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import RegisterClient from "./RegisterClient";

export const metadata = {
  title: "Create account | SkillBridge Academy",
  description: "Create your SkillBridge learner account and verify your email.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero register-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />JOIN SKILLBRIDGE</div>
            <h1>Create your <em>account.</em></h1>
            <p>Register as a learner, verify your email, and connect a parent or guardian.</p>
          </div>
        </section>
        <section className="section-wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
          <RegisterClient />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
