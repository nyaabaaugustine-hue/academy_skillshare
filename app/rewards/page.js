/* eslint-disable @next/next/no-img-element */
import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import EnquiryButton from "../../components/enquiry-popup";
import ProjectSubmissionForm from "../../components/project-submission-form";
import ShareActions from "../../components/share-actions";
import ReportProjectButton from "../../components/report-project-button";
import { getProjectShowcase } from "../../lib/content";
import { cloudflarePublicConfig } from "../../lib/cloudflare/public-config";
import { absoluteUrl } from "../../lib/site-url";

export const metadata = {
  title: "Rewards & Showcase | SkillBridge Academy",
  description: "Earn recognition for learning milestones, build real projects, and get featured on SkillBridge Academy.",
  alternates: { canonical: "/rewards" },
  openGraph: {
    title: "SkillBridge Rewards & Learner Showcase",
    description: "Child-friendly prizes, certificates, Python study program, and real learner projects.",
    url: "/rewards",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillBridge Rewards & Learner Showcase",
    description: "Child-friendly prizes, certificates, Python study program, and real learner projects.",
  },
};

export const revalidate = 60;

const milestones = [
  { icon: "🚀", title: "First Step", requirement: "Complete your first learning step", reward: "Leaderboard entry + SkillBridge branded pencil/eraser" },
  { icon: "🧠", title: "Practice Starter", requirement: "Complete 3 practice challenges", reward: "Practice badge + branded notebook or stationery" },
  { icon: "🔥", title: "Consistency Builder", requirement: "Complete 6 learning steps", reward: "Certificate + educational book/material" },
  { icon: "🛠️", title: "Project Builder", requirement: "Build and submit a real project", reward: "Project showcase feature + SkillBridge t-shirt" },
  { icon: "⭐", title: "Top Performer", requirement: "Reach top 10 on the leaderboard", reward: "Top Learner spotlight + books/educational materials" },
  { icon: "🏆", title: "SkillBridge Champion", requirement: "Complete 18 steps with strong average score", reward: "Champion certificate + t-shirt + featured learner story" },
];

const rewards = [
  { title: "Branded Stationery", text: "Earn SkillBridge branded pencils, erasers, and notebooks for completing learning milestones.", icon: "✏️" },
  { title: "T-Shirts & Swag", text: "Top learners and project builders can earn SkillBridge t-shirts and fun learning swag.", icon: "👕" },
  { title: "Books & Educational Material", text: "Receive age-appropriate books, workbooks, and educational materials to support your learning journey.", icon: "📚" },
  { title: "Digital Certificates", text: "Earn shareable certificates for milestones, course completion, and standout performance.", icon: "📜" },
  { title: "Project Showcase", text: "Get your best projects featured on our website to inspire others and show your skills.", icon: "🖥️" },
  { title: "Learner Spotlight", text: "Outstanding learners can be featured in stories, social posts, and community highlights.", icon: "🌟" },
];

const pythonProgram = [
  { level: "Level 1", title: "Python Basics", skills: ["Print, variables, and data types", "Input and simple math", "Writing your first programs"] },
  { level: "Level 2", title: "Logic & Loops", skills: ["If/else decisions", "For and while loops", "Solving problems step by step"] },
  { level: "Level 3", title: "Data & Functions", skills: ["Lists and dictionaries", "Functions and reusable code", "Organizing simple projects"] },
  { level: "Level 4", title: "Build & Share", skills: ["Debugging and testing", "Project planning", "Presenting your project"] },
];

const pythonBuilds = [
  "Number guessing game",
  "Quiz game with score tracking",
  "Simple calculator",
  "Story adventure game",
  "Password generator",
  "To-do list app",
  "Turtle art and patterns",
  "Mini chatbot",
  "Flashcard study app",
  "Simple weather or fact reporter",
  "Rock, paper, scissors game",
  "Personal budget tracker for kids",
];

export default async function RewardsPage() {
  let projects = [];
  try {
    projects = await getProjectShowcase();
  } catch {
    projects = [];
  }
  const siteKey = cloudflarePublicConfig().turnstileSiteKey;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero rewards-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />REWARDS &amp; SHOWCASE</div>
            <h1>Learn. Build. Get <em>recognized.</em></h1>
            <p>
              SkillBridge rewards progress, not just perfection. Complete milestones, build real projects, and earn
              recognition that showcases your skills to the world.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/leaderboard">View leaderboard <span className="arrow">↗</span></a>
              <EnquiryButton className="button button-glass" enquiryType="General enquiry" title="Submit a project" description="Tell us about the project you built. We’d love to review it for the SkillBridge learner showcase.">
                Submit a project <span className="arrow">↗</span>
              </EnquiryButton>
            </div>
            <div className="hero-share-wrap">
              <ShareActions url={absoluteUrl("/rewards")} text="See SkillBridge learner rewards, Python projects, and the learner showcase!" title="Share rewards" />
            </div>
          </div>
        </section>

        <section className="inner-content section-wrap">
          <div className="inner-section-heading">
            <div className="eyebrow"><span />MILESTONES</div>
            <h2>Milestones that matter</h2>
            <p>Every milestone marks real learning progress — from your first step to building projects that make an impact.</p>
          </div>
          <div className="rewards-grid">
            {milestones.map((m) => (
              <article className="reward-card" key={m.title}>
                <span className="reward-icon" aria-hidden="true">{m.icon}</span>
                <h3>{m.title}</h3>
                <p className="reward-req"><b>Milestone:</b> {m.requirement}</p>
                <p className="reward-reward"><b>Reward:</b> {m.reward}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="inner-content section-wrap">
          <div className="inner-section-heading">
            <div className="eyebrow"><span />PYTHON STUDY PROGRAM</div>
            <h2>Learn Python. Build real things.</h2>
            <p>A child-friendly learning path that takes learners from first code to real projects they can proudly share.</p>
          </div>
          <div className="rewards-grid">
            {pythonProgram.map((level) => (
              <article className="reward-card" key={level.title}>
                <small className="reward-level">{level.level}</small>
                <h3>{level.title}</h3>
                <ul className="reward-list">
                  {level.skills.map((skill) => <li key={skill}>{skill}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <div className="python-builds">
            <h3>What you can build with this program</h3>
            <div className="python-builds-grid">
              {pythonBuilds.map((item) => (
                <span className="python-build-chip" key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="values-band">
          <div className="section-wrap">
            <div className="inner-section-heading">
              <div className="eyebrow"><span />REWARDS &amp; PRIZES</div>
              <h2>How learners get recognized</h2>
            </div>
            <div className="rewards-grid rewards-grid-3">
              {rewards.map((r) => (
                <article className="reward-card reward-card-soft" key={r.title}>
                  <span className="reward-icon" aria-hidden="true">{r.icon}</span>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="inner-content section-wrap">
          <div className="inner-section-heading">
            <div className="eyebrow"><span />PRIZE &amp; SAFETY RULES</div>
            <h2>How prizes are awarded</h2>
            <p>We keep rewards fun, fair, and child-safe. Prizes are recognition for learning effort, skill-building, and positive participation.</p>
          </div>
          <div className="rewards-grid">
            <article className="reward-card"><h3>Eligibility</h3><p>Prizes are for active SkillBridge learners. Milestones are based on learning progress, practice, and approved projects.</p></article>
            <article className="reward-card"><h3>Child safety</h3><p>We only display a learner’s first name/alias with guardian permission. No private contact details are published.</p></article>
            <article className="reward-card"><h3>Availability</h3><p>Physical prizes (pencils, erasers, t-shirts, books, educational materials) depend on availability, sponsorship, or program campaigns.</p></article>
          </div>
        </section>

        <section className="inner-content section-wrap" id="submit-project">
          <div className="inner-section-heading">
            <div className="eyebrow"><span />SUBMIT A PROJECT</div>
            <h2>Share what you built</h2>
            <p>Built something with Python, web, or robotics skills? Submit it for review. Approved projects can be featured on our website.</p>
          </div>
          <ProjectSubmissionForm siteKey={cloudflarePublicConfig().turnstileSiteKey} />
        </section>

        <section className="inner-content section-wrap">
          <div className="inner-section-heading">
            <div className="eyebrow"><span />LEARNER PROJECT SHOWCASE</div>
            <h2>Built by SkillBridge learners</h2>
            <p>Real projects created by learners using the skills they’ve gained. This is where learning becomes visible impact.</p>
          </div>
          {projects.length === 0 ? (
            <div className="showcase-empty">
              <h3>Showcase coming alive</h3>
              <p>As learners complete projects, we’ll feature them here. Want to be among the first? Build something, submit it, and inspire the next learner.</p>
              <EnquiryButton className="button button-primary" enquiryType="General enquiry" title="Submit your project" description="Share your project details, what you built, and the skills you used. Our team will review it for the showcase.">
                Submit your project <span className="arrow">↗</span>
              </EnquiryButton>
            </div>
          ) : (
            <div className="showcase-grid">
              {projects.map((p) => (
                <article className="showcase-card" key={p.id || p.title}>
                  {p.image ? <img src={p.image} alt={p.title} loading="lazy" /> : <div className="showcase-placeholder" aria-hidden="true">{"</>"}</div>}
                  <div className="showcase-body">
                    <small>{p.skill || "Learner project"}</small>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                    <div className="showcase-meta">
                      <span>{p.learner_name || "SkillBridge Learner"}</span>
                      {p.project_url ? <a href={p.project_url} target="_blank" rel="noreferrer">View project ↗</a> : null}
                    </div>
                    <ReportProjectButton projectId={p.id} projectTitle={p.title} siteKey={siteKey} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
