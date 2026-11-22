import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import PlaygroundClient from "./PlaygroundClient";

export const metadata = {
  title: "Python Playground | SkillBridge Academy",
  description: "Practice Python in your browser with the SkillBridge Python Playground. Run code, see output, and learn by experimenting.",
  alternates: { canonical: "/playground" },
};

export default function PlaygroundPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section-wrap" style={{ paddingTop: 48, paddingBottom: 24 }}>
          <div className="eyebrow"><span />PYTHON PLAYGROUND</div>
          <h1 style={{ marginTop: 12, marginBottom: 12 }}>Write Python. <span style={{ color: "#5eead4" }}>Run it instantly.</span></h1>
          <p style={{ maxWidth: 760, opacity: 0.9 }}>
            Practice Python directly in your browser. This playground runs locally with Pyodide — no server execution, no account required. Use it to test ideas, debug small programs, and build confidence.
          </p>
        </section>
        <section className="section-wrap" style={{ paddingBottom: 64 }}>
          <PlaygroundClient />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
