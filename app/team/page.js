/* eslint-disable @next/next/no-img-element */

import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import EnquiryButton from "../../components/enquiry-popup";
import { getTeamMembers } from "../../lib/content";

export const metadata = {
  title: "Our Team | SkillBridge",
  description: "Meet the people and expertise that help SkillBridge make technology learning accessible."
};

export default async function TeamPage() {
  const team = await getTeamMembers();
  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero team-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />THE PEOPLE BEHIND THE POSSIBILITY</div>
            <h1>Meet the team building <em>what’s next.</em></h1>
            <p>Educators, community builders and advocates for a more inclusive digital future.</p>
            <div className="hero-actions">
              <EnquiryButton className="button button-green" enquiryType="General enquiry" title="Connect with our team" description="Send us a note and the right person on the team will get back to you.">
                Connect with our team <span className="arrow">→</span>
              </EnquiryButton>
              <a className="button button-glass" href="/contact">Contact us <span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        <section className="section-wrap ip-stats" aria-label="Team highlights">
          <article className="ip-stat"><strong>Mission-led</strong><b>Purpose first</b><p>Every decision centers on learner access and opportunity.</p></article>
          <article className="ip-stat"><strong>Community</strong><b>Built together</b><p>We work with families, schools, and partners.</p></article>
          <article className="ip-stat"><strong>Practical</strong><b>Hands-on learning</b><p>We focus on skills learners can use and grow.</p></article>
          <article className="ip-stat"><strong>Care</strong><b>Safe & supportive</b><p>Learners are welcomed, encouraged, and respected.</p></article>
        </section>

        <section className="inner-content section-wrap team-section">
          <div className="inner-section-heading team-heading">
            <div className="eyebrow"><span />OUR PEOPLE</div>
            <h2>Different strengths. One shared purpose.</h2>
            <p>The people behind SkillBridge bring together education, technology, and community partnerships to create practical learning opportunities.</p>
          </div>
          <div className="team-grid">
            {team.map((member, index) => (
              <article className="team-card" key={member.name}>
                <div className="team-photo-wrap">
                  <img src={member.image} alt={`${member.name}, ${member.role}`} className="team-photo" loading="lazy" />
                  <span className="team-number">0{index + 1}</span>
                </div>
                <div className="team-card-content">
                  <span className="team-focus">{member.focus}</span>
                  <h3>{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                  <p className="team-bio">{member.bio}</p>
                  <EnquiryButton className="enquiry-plain enquiry-card-link" enquiryType="General enquiry" title="Connect with SkillBridge" description={`Tell us what you would like to discuss about the ${member.role} role.`}>
                    Connect with SkillBridge <span className="arrow">→</span>
                  </EnquiryButton>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-wrap inner-cta">
          <div>
            <div className="eyebrow"><span />WORK WITH US</div>
            <h2>Want to help shape the future of young learners?</h2>
          </div>
          <div className="hero-actions">
            <EnquiryButton className="button button-primary" enquiryType="Partnerships" title="Partner with SkillBridge" description="Tell us how you'd like to collaborate, volunteer, or support our programs.">Partner with us <span className="arrow">→</span></EnquiryButton>
            <a className="button button-outline" href="/about">About SkillBridge</a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
