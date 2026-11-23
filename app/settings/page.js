import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import InstallAppButton from "../../components/install-app-button";

export const metadata = {
  title: "Settings | SkillBridge Academy",
  description: "Manage your SkillBridge Academy app settings, install the app, and control your learning preferences.",
  alternates: { canonical: "/settings" },
};

export default function SettingsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero settings-hero" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.86), rgba(255,255,255,0.86)), url('https://res.cloudinary.com/z43ds8bn/image/upload/v1795345655/Repeating_Education_Coding_Logo_Pattern.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "repeat" }}>
          <div className="inner-hero-content">
            <div className="eyebrow"><span />SETTINGS</div>
            <h1>Manage your <em>SkillBridge experience.</em></h1>
            <p>Control app installation, learning preferences, and how you use SkillBridge Academy.</p>
            <div className="hero-actions" style={{ justifyContent: "center", marginTop: 14, gap: 10, flexWrap: "wrap" }}>
              <InstallAppButton className="button button-primary button-small" label="Install app" />
              <a className="button button-glass button-small" href="/rewards">View rewards <span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        <section className="section-wrap ip-two-col" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <div className="ip-panel">
            <div className="eyebrow"><span />APP</div>
            <h2>SkillBridge Learning App</h2>
            <p>Install SkillBridge on your phone or tablet so you can learn anytime, even with a spotty connection.</p>
            <div className="ip-check-list">
              <li><b>Install on Android</b><span>Download the APK and install it directly on your Android device.</span></li>
              <li><b>Install on iOS</b><span>Open the app in Safari, tap Share, then “Add to Home Screen.”</span></li>
              <li><b>PWA offline support</b><span>The app caches assets so lessons keep working when you’re offline.</span></li>
            </div>
            <div className="hero-actions" style={{ marginTop: 16 }}>
              <a className="button button-primary button-small" href="/downloads/skillsbridge-1.0.0-beta.apk" download>Download Android APK <span className="arrow">→</span></a>
            </div>
          </div>
          <div className="ip-panel ip-panel-accent">
            <div className="eyebrow"><span />LEARNING</div>
            <h2>Learning preferences</h2>
            <p>Tailor how SkillBridge teaches and reminds you.</p>
            <div className="ip-check-list">
              <li><b>Tutor mode</b><span>Choose Explain, Debug, Quiz, Study Plan, Code Review, or Project Coach when you chat with App Robot.</span></li>
              <li><b>Reading level</b><span>Ask App Robot to simplify explanations for younger learners.</span></li>
              <li><b>Reminders</b><span>Get gentle nudges to keep your learning streak going.</span></li>
              <li><b>Language</b><span>Interface and tutor responses in English (more languages coming).</span></li>
            </div>
          </div>
        </section>

        <section className="section-wrap ip-stats" aria-label="Settings highlights">
          <article className="ip-stat"><strong>App Robot</strong><b>Your AI tutor</b><p>100+ planned tutoring capabilities across coding, CS, and coaching.</p></article>
          <article className="ip-stat"><strong>Private</strong><b>No PII stored</b><p>Personal details are redacted before any AI context is used.</p></article>
          <article className="ip-stat"><strong>Free</strong><b>$0 tier</b><p>No subscriptions, no paid add-ons, no ads.</p></article>
          <article className="ip-stat"><strong>Support</strong><b>Help & feedback</b><p>Email support@skillbridgeacademy.tech or info@skillbridgeacademy.tech.</p></article>
        </section>

        <section className="inner-cta section-wrap" style={{ paddingTop: 58, paddingBottom: 58, textAlign: "center" }}>
          <div>
            <div className="eyebrow"><span />NEED HELP?</div>
            <h2>Got a question or idea?</h2>
          </div>
          <div className="hero-actions" style={{ justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <a className="button button-primary" href="mailto:support@skillbridgeacademy.tech">Email support <span className="arrow">→</span></a>
            <a className="button button-outline" href="/contact">Contact us <span className="arrow">→</span></a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
