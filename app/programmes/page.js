import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import EnquiryButton from "../../components/enquiry-popup";

export const metadata = {
  title: "Programmes | SkillBridge",
  description: "Explore SkillBridge's age-based digital learning pathways for young people."
};

const pathways = [
  {
    age: "AGES 7–9", title: "Young Explorers", accent: "green",
    description: "Build confidence with computers, creative thinking and playful introductions to technology.",
    topics: ["Digital literacy", "Creative computing", "Beginner robotics"],
    outcome: "Confidence using technology and curiosity to explore."
  },
  {
    age: "AGES 10–13", title: "Digital Creators", accent: "blue",
    description: "Explore coding, websites and hands-on electronics while learning to solve real problems.",
    topics: ["Scratch and Python", "Web foundations", "Robotics projects"],
    outcome: "Ability to build simple digital projects and think logically."
  },
  {
    age: "AGES 14–16", title: "Future Innovators", accent: "purple",
    description: "Develop practical skills in programming, AI, IoT and innovation through guided projects.",
    topics: ["Python programming", "AI and IoT basics", "Innovation challenges"],
    outcome: "Real-world project experience and future-ready tech skills."
  }
];

const steps = [
  { title: "Assess", text: "We understand the learner's age, interests, and starting point." },
  { title: "Learn", text: "Learners follow age-appropriate lessons with guided practice." },
  { title: "Build", text: "They apply skills through projects, challenges, and creativity." },
  { title: "Grow", text: "Progress is celebrated with feedback, milestones, and next steps." },
];

export default function ProgrammesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero programmes-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />LEARN BY DOING</div>
            <h1>A pathway for every <em>curious mind.</em></h1>
            <p>Age-based programmes make digital learning practical, welcoming and exciting at every stage.</p>
            <div className="hero-actions">
              <EnquiryButton className="button button-green" enquiryType="Programmes and courses" title="Ask about a programme" description="Tell us the learner's age and what they are curious about, and we will point you to the right pathway.">
                Ask about a programme <span className="arrow">→</span>
              </EnquiryButton>
              <a className="button button-glass" href="/leaderboard">View leaderboard <span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        <section className="inner-content section-wrap pathway-section">
          <div className="inner-section-heading">
            <div className="eyebrow"><span />OUR PROGRAMMES</div>
            <h2>Start with curiosity. Grow into capability.</h2>
            <p>Each pathway introduces new ideas at a pace that supports confidence, creativity and hands-on discovery.</p>
          </div>
          <div className="pathway-grid">
            {pathways.map((pathway, index) => (
              <article className={`pathway-card ${pathway.accent}`} key={pathway.title}>
                <div className="pathway-card-top"><span>{pathway.age}</span><b>0{index + 1}</b></div>
                <div className="pathway-card-body">
                  <h3>{pathway.title}</h3>
                  <p>{pathway.description}</p>
                  <ul>{pathway.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
                  <p className="ip-outcome"><b>Outcome:</b> {pathway.outcome}</p>
                  <EnquiryButton className="enquiry-plain enquiry-card-link" enquiryType="Programmes and courses" title={`Enquire about ${pathway.title}`} description={`${pathway.age} · tell us a little about the learner and we will explain what this pathway covers.`} programme={pathway.title}>
                    Enquire about this pathway <span className="arrow">→</span>
                  </EnquiryButton>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-wrap ip-steps-section">
          <div className="inner-section-heading">
            <div className="eyebrow"><span />HOW IT WORKS</div>
            <h2>A simple path from curiosity to confidence.</h2>
            <p>We make learning approachable, structured, and rewarding for young people at every stage.</p>
          </div>
          <div className="ip-steps-grid">
            {steps.map((s, i) => (
              <article key={s.title} className="ip-step">
                <span className="ip-step-no">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pathway-callout">
          <div className="section-wrap inner-cta">
            <div>
              <div className="eyebrow"><span />LEARNING TOGETHER</div>
              <h2>Bring digital skills to your school or community.</h2>
            </div>
            <div className="hero-actions">
              <EnquiryButton className="button button-primary" enquiryType="Partnerships" title="Start a conversation" description="Bring digital skills to your school or community — tell us who you would like to reach.">
                Start a conversation <span className="arrow">→</span>
              </EnquiryButton>
              <a className="button button-outline" href="/contact">Contact us</a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
