import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import TutorClient from "./TutorClient";

export const metadata = {
  title: "App Robot Tutor | SkillBridge Academy",
  description: "Chat with App Robot, your SkillBridge AI tutor. Ask questions, debug code, get quizzes and study plans.",
  alternates: { canonical: "/tutor" },
};

export default function TutorPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero tutor-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />APP ROBOT</div>
            <h1>Learn with <em>App Robot.</em></h1>
            <p>Your SkillBridge AI tutor for coding, computer science, debugging, quizzes and study plans. Pick a mode and start chatting.</p>
            <div className="hero-actions" style={{ justifyContent: "center", marginTop: 14, gap: 10, flexWrap: "wrap" }}>
              <a className="button button-primary button-small" href="/playground">Open Python Playground <span className="arrow">→</span></a>
              <a className="button button-glass button-small" href="/settings">App settings <span className="arrow">→</span></a>
            </div>
          </div>
        </section>
        <section className="section-wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
          <TutorClient />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
