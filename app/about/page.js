import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import EnquiryButton from "../../components/enquiry-popup";

export const metadata = {
  title: "About SkillBridge | Learn Today. Innovate Tomorrow.",
  description: "Learn about SkillBridge's mission to make technology education more accessible to young people in Ghana."
};

const stats = [
  { value: "7–16", label: "Ages we serve", detail: "Age-appropriate pathways for children and teens." },
  { value: "3", label: "Learning pathways", detail: "From digital basics to coding, AI and innovation." },
  { value: "Hands-on", label: "Learning style", detail: "Projects, practice, creativity and real-world problem solving." },
  { value: "Ghana+", label: "Community focus", detail: "Rooted in Ghana, collaborating across borders." },
];

const pillars = [
  { no: "01", title: "Access", text: "Make meaningful technology learning welcoming, affordable, and reachable for every young person." },
  { no: "02", title: "Creativity", text: "Help learners build, test ideas, make mistakes safely, and grow through hands-on creation." },
  { no: "03", title: "Community", text: "Bring learners, families, educators, and partners together around opportunity and care." },
  { no: "04", title: "Confidence", text: "Equip young people with practical skills and the belief that they belong in tech." },
];

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero about-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />WHO WE ARE</div>
            <h1>Bridging young people to a world of <em>possibility.</em></h1>
            <p>We believe every child deserves the chance to learn, create and find their place in a digital future.</p>
            <div className="hero-actions">
              <EnquiryButton className="button button-green" enquiryType="Partnerships" title="Work with us" description="Tell us about your organisation and the kind of collaboration you have in mind.">
                Work with us <span className="arrow">→</span>
              </EnquiryButton>
              <a className="button button-glass" href="/programmes">Explore programmes <span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        <section className="section-wrap ip-stats" aria-label="SkillBridge highlights">
          {stats.map((s) => (
            <article key={s.label} className="ip-stat">
              <strong>{s.value}</strong>
              <b>{s.label}</b>
              <p>{s.detail}</p>
            </article>
          ))}
        </section>

        <section className="inner-content section-wrap about-story">
          <div>
            <div className="eyebrow"><span />OUR PURPOSE</div>
            <h2>Opportunity should never depend on where you start.</h2>
          </div>
          <div className="inner-copy">
            <p>SkillBridge is a Ghana-focused technology education initiative working to make digital learning more accessible to children and young people. We pair practical, age-appropriate learning with the encouragement to ask questions, experiment and build.</p>
            <p>Our goal is to help close the digital divide by connecting young people with useful skills, welcoming learning communities and the confidence to imagine what comes next.</p>
            <p>From first digital steps to coding, robotics, AI, and innovation challenges, we create learning experiences that are relevant, encouraging, and grounded in real-world possibility.</p>
          </div>
        </section>

        <section className="values-band">
          <div className="section-wrap">
            <div className="inner-section-heading">
              <div className="eyebrow"><span />WHAT GUIDES US</div>
              <h2>The values behind every learning experience.</h2>
              <p>Our approach is practical, inclusive, and built around the potential of every learner.</p>
            </div>
            <div className="values-grid ip-values-grid">
              {pillars.map((p) => (
                <article key={p.no}>
                  <span>{p.no}</span>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-wrap ip-two-col">
          <div className="ip-panel">
            <div className="eyebrow"><span />HOW WE WORK</div>
            <h2>Learning that feels welcoming, practical, and real.</h2>
            <ul className="ip-check-list">
              <li><b>Age-appropriate pathways</b><span>Programs designed for where learners are, not where we assume they should be.</span></li>
              <li><b>Project-based practice</b><span>Learners build, test, and improve ideas through hands-on activities.</span></li>
              <li><b>Supportive community</b><span>Families, educators, mentors, and partners all play a role in learner growth.</span></li>
              <li><b>Future-ready skills</b><span>Digital literacy, coding, creativity, and problem-solving that matter beyond the classroom.</span></li>
            </ul>
          </div>
          <div className="ip-panel ip-panel-accent">
            <div className="eyebrow"><span />THE IMPACT WE WANT</div>
            <h2>More than skills. Confidence, agency, and opportunity.</h2>
            <p>We want young people to see technology not as something distant, but as something they can understand, shape, and use to improve their lives and communities.</p>
            <div className="ip-mini-stats">
              <div><strong>Learn</strong><span>Build strong digital foundations.</span></div>
              <div><strong>Create</strong><span>Turn ideas into projects.</span></div>
              <div><strong>Lead</strong><span>Grow confidence for the future.</span></div>
            </div>
          </div>
        </section>

        <section className="inner-cta section-wrap">
          <div>
            <div className="eyebrow"><span />MEET THE PEOPLE BEHIND THE WORK</div>
            <h2>Good futures are built together.</h2>
          </div>
          <div className="hero-actions">
            <a className="button button-primary" href="/team">Meet our team <span className="arrow">→</span></a>
            <EnquiryButton className="button button-outline" enquiryType="Partnerships" title="Partner with SkillBridge" description="Tell us how you'd like to support learners, schools, or communities.">Partner with us</EnquiryButton>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
