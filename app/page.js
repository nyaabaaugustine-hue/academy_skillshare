/* eslint-disable @next/next/no-img-element */

import { SiteFooter, SiteHeader } from "../components/site-chrome";
import HomeHero from "../components/home-hero";
import EnquiryButton from "../components/enquiry-popup";
import ShareActions from "../components/share-actions";
import ReportProjectButton from "../components/report-project-button";
import { getFeaturedCourse, getFeaturedNews, getTeamMembers, getUpcomingTrainings, getProjectShowcase } from "../lib/content";
import { listLeaderboard } from "../lib/server/leaderboard";
import { learnerAuthUrl } from "../lib/learner-app-url";
import { cloudflarePublicConfig } from "../lib/cloudflare/public-config";
import { absoluteUrl } from "../lib/site-url";
import TurnstileWidget from "../components/turnstile-widget";
import UpcomingTrainings from "../components/upcoming-trainings";

const programmes = [
  {
    age: "AGES 7–9",
    title: "Young Explorers",
    subtitle: "Discover the digital world",
    description: "Build confidence with computers, creative thinking and playful introductions to technology.",
    className: "green",
    icon: "✦",
    topics: ["Digital literacy", "Creative computing", "Beginner robotics"]
  },
  {
    age: "AGES 10–13",
    title: "Digital Creators",
    subtitle: "Turn ideas into projects",
    description: "Explore coding, websites and hands-on electronics while learning to solve real problems.",
    className: "blue",
    icon: "</>",
    topics: ["Scratch and Python", "Web foundations", "Robotics projects"]
  },
  {
    age: "AGES 14–16",
    title: "Future Innovators",
    subtitle: "Create what comes next",
    description: "Develop practical skills in programming, AI, IoT and innovation through guided projects.",
    className: "purple",
    icon: "⌘",
    topics: ["Python programming", "AI and IoT basics", "Innovation challenges"]
  }
];

const involvement = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Volunteer",
    text: "Share your time and skills.",
    enquiryType: "Volunteering",
    description: "Tell us how you'd like to volunteer, your skills, and your availability. We'll connect you with the right opportunity.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 7l-5 5 5 5" /><path d="M16 7l5 5-5 5" /><path d="M14 4l-4 16" />
      </svg>
    ),
    title: "Partner",
    text: "Bring technology learning to more communities.",
    enquiryType: "Partnerships",
    description: "Share your organization and partnership idea. We'll explore how we can bring technology learning to more communities together.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    ),
    title: "Donate",
    text: "Help provide tools and learning opportunities.",
    enquiryType: "Donations and support",
    description: "Tell us how you'd like to support SkillBridge. We'll share the best way to help provide tools and learning opportunities.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.8V21h14V9.8" /><path d="M9 21v-6h6v6" />
      </svg>
    ),
    title: "Support a school",
    text: "Help a school start its digital journey.",
    enquiryType: "School registration",
    description: "Tell us about the school you'd like to support or register. We'll help them start their digital learning journey.",
  },
]

function Arrow() {
  return <span aria-hidden="true" className="arrow">↗</span>;
}

function SectionEyebrow({ children }) {
  return <div className="eyebrow"><span />{children}</div>;
}

export const revalidate = 30;

export default async function Home({ searchParams }) {
  const [team, news, course, upcomingTrainings, topLearners, showcaseProjects] = await Promise.all([
    getTeamMembers(),
    getFeaturedNews(),
    getFeaturedCourse(),
    getUpcomingTrainings(),
    listLeaderboard(3).catch(() => []),
    getProjectShowcase().catch(() => []),
  ]);
  const params = await searchParams;
  const schoolStatus = params?.school;
  const courseStatus = params?.course;
  const courseWords = course.title.trim().split(/\s+/);
  const courseLead =
    courseWords.length > 1 ? courseWords.slice(0, -1).join(" ") : course.title;
  const courseAccent = courseWords.length > 1 ? courseWords[courseWords.length - 1] : "";
  return (
    <main>
      <SiteHeader />
      <HomeHero />

    <section className="about-section" id="about">
      <div className="about-image">
        <div className="image-label"><span>SKILLBRIDGE</span><small>Technology for possibility</small></div>
      </div>
      <div className="about-copy">
        <SectionEyebrow>WHO WE ARE</SectionEyebrow>
        <h2>Opening doors to a world of <span>possibilities.</span></h2>
        <p>SkillBridge is a Ghana-focused technology education initiative working to make digital learning more accessible to children and young people. We believe a child’s background should never determine their opportunity to learn, create and innovate.</p>
        <a className="button button-primary" href="/about">Learn about our mission <Arrow /></a>
      </div>
      <aside className="mission-card">
        <span className="mission-icon">◎</span>
        <SectionEyebrow>OUR MISSION</SectionEyebrow>
        <h3>Bridge the digital divide.</h3>
        <p>Connect young people with the knowledge, tools and mentors they need to participate in a technology-driven world.</p>
        <a href="#get-involved">How you can help <Arrow /></a>
      </aside>
    </section>

      <section className="impact-strip" aria-label="Our impact">
        <div><strong>01</strong><span><b>Children reached</b><small>Growing digital confidence</small></span></div>
        <div><strong>02</strong><span><b>Schools supported</b><small>Bringing learning closer</small></span></div>
        <div><strong>03</strong><span><b>Tech workshops</b><small>Learning by doing</small></span></div>
        <div><strong>04</strong><span><b>Student projects</b><small>Ideas made real</small></span></div>
      </section>

      <section className="programmes section-wrap" id="programmes">
        <div className="section-intro">
          <SectionEyebrow>OUR PROGRAMMES</SectionEyebrow>
          <h2>Technology learning for <span>every stage.</span></h2>
          <p>Every child has a different starting point. Our age-based pathways make technology approachable, practical and exciting.</p>
          <a className="text-link" href="/programmes">Discover all programmes <Arrow /></a>
        </div>
        <div className="programme-grid">
          {programmes.map((item) => (
            <article className={`programme-card ${item.className}`} key={item.title}>
              <div className="programme-top"><span>{item.age}</span><b>{item.icon}</b></div>
              <div className="programme-body">
                <h3>{item.title}</h3>
                <strong>{item.subtitle}</strong>
                <p>{item.description}</p>
                <ul>{item.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
                <EnquiryButton
                  className="enquiry-plain enquiry-card-link"
                  enquiryType="Programmes and courses"
                  title={`Enquire about ${item.title}`}
                  description={`${item.age} · tell us a little about the learner and we will explain what this pathway covers.`}
                  programme={item.title}
                >
                  Explore pathway <Arrow />
                </EnquiryButton>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="featured-course" id="featured-course">
        <div className="featured-course-bg" aria-hidden="true">
          <video autoPlay muted loop playsInline preload="metadata">
            <source src="https://res.cloudinary.com/dx1nrew3h/video/upload/v1794568662/www.magnific.com_boy-interacting-with-a-robot-premium-stock-video-footage_fucjby.mp4" type="video/mp4" />
          </video>
          <div className="featured-course-bg-overlay" />
        </div>
        <div className="section-wrap featured-grid">
          <div className="featured-media">
            <img
              src="https://res.cloudinary.com/z43ds8bn/image/upload/v1795347916/programer-sitting-desk-with-multiple-screens-running-code-talking-with-colleague-about-artificial-intelligence-algorithm-software-developers-doing-innovative-artificial-intelligence-project.jpg"
              alt={`${course.title} at SkillBridge`}
              loading="lazy"
            />
            <span className="featured-badge">
              <span className="featured-badge-dot" aria-hidden="true" />
              UPCOMING COURSE
            </span>
            <div className="featured-media-meta">
              <span>
                <small>STARTS</small>
                <strong>{course.startDateLabel}</strong>
              </span>
              <span>
                <small>DURATION</small>
                <strong>{course.duration || "Flexible"}</strong>
              </span>
              <span>
                <small>FORMAT</small>
                <strong>{course.format || "Online + in person"}</strong>
              </span>
            </div>
          </div>

          <div className="featured-copy">
            <SectionEyebrow>ENROLMENT OPEN</SectionEyebrow>
            <h2>
              {courseLead} {courseAccent ? <span>{courseAccent}</span> : null}
            </h2>
            <p>{course.summary}</p>

            {course.topics.length > 0 ? (
              <ul className="featured-topics" aria-label="Course topics">
                {course.topics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            ) : null}

            <div className="featured-facts">
              <span>
                <small>LEVEL</small>
                <b>{course.level || "All levels"}</b>
              </span>
              <span>
                <small>FORMAT</small>
                <b>{course.format || "Online + in person"}</b>
              </span>
              <span>
                <small>DURATION</small>
                <b>{course.duration || "Flexible"}</b>
              </span>
            </div>

            <div className="featured-outcomes-block">
              <span className="featured-outcomes-title">WHAT YOU WILL LEARN</span>
              <ul className="featured-outcomes">
                {course.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </div>

            {courseStatus === "joined" ? (
              <p className="form-note form-note-ok" role="status">
                You are on the interest list. We will email you the start date and
                what to bring.
              </p>
            ) : null}
            {courseStatus === "error" ? (
              <p className="form-note form-note-error" role="alert">
                That did not send. Add your name and a valid email and try again.
              </p>
            ) : null}
            {courseStatus === "turnstile" ? (
              <p className="form-note form-note-error" role="alert">
                Verification failed. Please complete the check and try again.
              </p>
            ) : null}

            <div className="featured-cta-panel">
              <div className="featured-cta-head">
                <strong>{course.ctaLabel}</strong>
                <p>
                  Registration and sign-in happen in the SkillBridge learner app.
                  Creating an account takes a few minutes.
                </p>
              </div>
              <div className="featured-cta-actions">
                <a className="button button-green" href={learnerAuthUrl}>
                  Create learner account <Arrow />
                </a>
                <a className="button button-glass" href={learnerAuthUrl}>
                  Sign in to the LMS
                </a>
              </div>
              <p className="featured-cta-note">
                Already registered? Sign in with the same email you used to enrol.
                {course.link ? (
                  <>
                    {" "}
                    <a href={course.link}>Course details ↗</a>
                  </>
                ) : null}
              </p>
            </div>

            <details className="featured-waitlist">
              <summary>Prefer to hear from us first? Join the interest list</summary>
              <p>
                Share a few details and our team will contact you about the next
                cohort.
              </p>
              <form
                className="school-form"
                action="/api/enroll"
                method="post"
                aria-label={`${course.title} interest list`}
              >
                <input type="hidden" name="programme" value={course.title} />
                <div className="form-field">
                  <label htmlFor="learner-name">Full name</label>
                  <input id="learner-name" name="full_name" autoComplete="name" required />
                </div>
                <div className="form-field">
                  <label htmlFor="learner-email">Email</label>
                  <input
                    id="learner-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="learner-phone">Phone (optional)</label>
                  <input id="learner-phone" name="phone" type="tel" autoComplete="tel" />
                </div>
                <div className="form-field">
                  <label htmlFor="learner-school">
                    School or community (optional)
                  </label>
                  <input id="learner-school" name="school" />
                </div>
                <div className="form-field-wide">
                  <TurnstileWidget siteKey={cloudflarePublicConfig().turnstileSiteKey} action="course-enroll" />
                  <button className="button button-green school-submit" type="submit">
                    Join the interest list{" "}
                    <span aria-hidden="true" className="arrow">
                      ↗
                    </span>
                  </button>
                  <p className="form-note">
                    We only use these details to contact you about the course.
                  </p>
                </div>
              </form>
            </details>
          </div>
        </div>
      </section>

      <UpcomingTrainings trainings={upcomingTrainings} />

      <section className="student-hub section-wrap" id="student-hub">
        <div className="hub-copy">
          <SectionEyebrow>STUDENT INNOVATION HUB</SectionEyebrow>
          <h2>Big ideas can start <span>small.</span></h2>
          <p>Give young creators a place to explore technology, share projects and celebrate what they have built.</p>
          <a className="button button-outline" href="#contact">Explore student projects <Arrow /></a>
        </div>
        <div className="student-showcase">
          <div className="project-tiles">
            <div className="project-tile tile-one"><span>01 / ROBOTICS</span><b>Build. Test. Improve.</b></div>
            <div className="project-tile tile-two"><span>02 / CODING</span><b>Turn logic into ideas.</b></div>
            <div className="project-tile tile-three"><span>03 / CREATIVITY</span><b>Imagine what’s possible.</b></div>
          </div>
          <div className="phone-stage" aria-label="Phone preview placeholder for the app screenshot">
            <div className="phone-device">
              <div className="phone-speaker" />
              <div className="phone-screen">
                <img
                  className="phone-screenshot"
                  src="https://res.cloudinary.com/dx1nrew3h/image/upload/v1795204092/SkillBridge_Academy_Learning_Journey_e0qydt.png"
                  alt="SkillBridge Academy learning journey app preview"
                />
              </div>
              <div className="phone-home-indicator" />
            </div>
            <span className="phone-caption">SKILLBRIDGE APP PREVIEW</span>
            <div className="hero-actions" style={{ justifyContent: "center", marginTop: 14, gap: 10, flexWrap: "wrap" }}>
              <a className="button button-primary button-small" href="/downloads/skillsbridge-1.0.0-beta.apk" download style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85a.637.637 0 0 0-.83.22l-1.88 3.24a11.463 11.463 0 0 0-8.94 0L5.65 5.67a.643.643 0 0 0-.87-.2c-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 0 0 1 18h22a10.78 10.78 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"/></svg>
                Download for Android
              </a>
              <a className="button button-glass button-small" href="/app/index.html?v=2" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.417 2.2-1.243 3.13-.998 1.115-2.205 1.76-3.515 1.654-.03-.14-.046-.287-.046-.44 0-1.094.476-2.265 1.32-3.23.422-.48.96-.88 1.613-1.2.654-.315 1.272-.49 1.854-.523.012.203.017.406.017.61zM20.5 17.08c-.585 1.35-.867 1.953-1.62 3.148-1.05 1.665-2.53 3.74-4.366 3.755-1.63.015-2.05-1.06-4.263-1.048-2.213.012-2.675 1.067-4.306 1.052-1.835-.016-3.24-1.886-4.29-3.55-2.94-4.66-3.245-10.13-1.435-13.03 1.285-2.057 3.314-3.262 5.223-3.262 1.942 0 3.163 1.065 4.77 1.065 1.558 0 2.507-1.067 4.754-1.067 1.7 0 3.5.926 4.783 2.527-4.202 2.303-3.52 8.304.55 10.41z"/></svg>
                Download for iOS
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="home-team">
        <div className="section-wrap">
          <div className="home-team-heading">
            <div>
              <SectionEyebrow>THE PEOPLE BEHIND THE POSSIBILITY</SectionEyebrow>
              <h2>Meet the team building <span>what’s next.</span></h2>
            </div>
            <a className="text-link" href="/team">Meet the full team <Arrow /></a>
          </div>
          <p className="profile-disclaimer">A dedicated team shaping accessible, practical technology learning across Ghana.</p>
          <div className="team-grid home-team-grid">
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
                  <a href="/team">Meet the team <Arrow /></a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="school-registration-section" id="school-registration">
        <div className="section-wrap school-registration-grid">
          <div className="registration-image">
            <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=85" alt="Students learning together in a classroom" />
            <div className="registration-image-copy">
              <span>FOR SCHOOLS &amp; EDUCATORS</span>
              <h2>Bring new possibilities into your classroom.</h2>
              <p>Tell us about your school and we’ll get in touch about the next steps.</p>
            </div>
          </div>
          <div className="registration-form-panel">
            <SectionEyebrow>START A SCHOOL ENQUIRY</SectionEyebrow>
            <h2>Register your school</h2>
            <p>Share a few details so our team can learn how to support your students.</p>
            {schoolStatus === "received" ? (
              <p className="form-note form-note-ok" role="status">
                Thank you — your enquiry reached us. Our team will be in touch.
              </p>
            ) : null}
            {schoolStatus === "error" ? (
              <p className="form-note form-note-error" role="alert">
                That did not send. Check the required fields and try again.
              </p>
            ) : null}
            <form
              className="school-form"
              action="/api/enquiries"
              method="post"
              aria-label="School registration enquiry"
            >
              <input type="hidden" name="_subject" value="School registration enquiry - SkillBridge" />
              <div className="form-field">
                <label htmlFor="school-name">School name</label>
                <input id="school-name" name="school_name" autoComplete="organization" required />
              </div>
              <div className="form-field">
                <label htmlFor="school-location">School location</label>
                <input id="school-location" name="school_location" placeholder="Town or district" required />
              </div>
              <div className="form-field">
                <label htmlFor="contact-name">Your name</label>
                <input id="contact-name" name="contact_name" autoComplete="name" required />
              </div>
              <div className="form-field">
                <label htmlFor="contact-email">Work email</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="form-field">
                <label htmlFor="contact-phone">Phone number</label>
                <input id="contact-phone" name="phone" type="tel" autoComplete="tel" />
              </div>
              <div className="form-field">
                <label htmlFor="learner-count">Learners to register</label>
                <select id="learner-count" name="learner_count" defaultValue="" required>
                  <option value="" disabled>Select an estimate</option>
                  <option>1–25</option>
                  <option>26–50</option>
                  <option>51–100</option>
                  <option>100+</option>
                </select>
              </div>
              <div className="form-field form-field-wide">
                <label htmlFor="programme-interest">Programme of interest</label>
                <select id="programme-interest" name="programme_interest" defaultValue="Digital skills and coding">
                  <option>Digital skills and coding</option>
                  <option>Robotics and innovation</option>
                  <option>School partnership</option>
                  <option>Not sure yet</option>
                </select>
              </div>
              <div className="form-field form-field-wide">
                <label htmlFor="school-message">Anything else we should know?</label>
                <textarea id="school-message" name="message" rows="3" />
              </div>
              <div className="form-field-wide">
                <TurnstileWidget siteKey={cloudflarePublicConfig().turnstileSiteKey} action="school-enquiry" />
                <button className="button button-primary school-submit" type="submit">Submit school enquiry <span aria-hidden="true" className="arrow">↗</span></button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="section-wrap spotlight-section" id="spotlight">
        <div className="spotlight-grid">
          <div>
            <div className="eyebrow"><span />TOP LEARNERS</div>
            <h2>Celebrating <span>learning progress.</span></h2>
            <p className="spotlight-copy">Learners who show up, practice, and build skills earn their place on the leaderboard.</p>
            <div className="spotlight-learners">
              {topLearners.length === 0 ? (
                <p className="admin-empty">Leaderboard rankings will appear here as learners complete steps.</p>
              ) : topLearners.map((entry) => (
                <div className="spotlight-learner" key={entry.id}>
                  <span className="spotlight-rank">{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}</span>
                  <img src={`/api/leaderboard/avatar/${encodeURIComponent(entry.id)}`} alt="" width={40} height={40} />
                  <div><b>{entry.name}</b><small>{entry.score} pts · {entry.stepsCompleted} steps</small></div>
                </div>
              ))}
            </div>
            <a className="text-link" href="/leaderboard">View full leaderboard <span className="arrow">↗</span></a>
          </div>
          <div className="spotlight-project">
            <div className="eyebrow"><span />FEATURED PROJECT</div>
            <h2>Built by <span>young learners.</span></h2>
            {showcaseProjects[0] ? (
              <article className="showcase-card">
                {showcaseProjects[0].image ? <img src={showcaseProjects[0].image} alt={showcaseProjects[0].title} loading="lazy" /> : <div className="showcase-placeholder" aria-hidden="true">{"</>"}</div>}
                <div className="showcase-body">
                  <small>{showcaseProjects[0].skill || "Learner project"}</small>
                  <h3>{showcaseProjects[0].title}</h3>
                  <p>{showcaseProjects[0].description}</p>
                  <div className="showcase-meta"><span>{showcaseProjects[0].learner_name || "SkillBridge Learner"}</span><a href="/rewards">See rewards <span className="arrow">↗</span></a></div>
                  <ReportProjectButton projectId={showcaseProjects[0].id} projectTitle={showcaseProjects[0].title} siteKey={cloudflarePublicConfig().turnstileSiteKey} />
                </div>
              </article>
            ) : (
              <div className="showcase-empty">
                <h3>Your project could be here</h3>
                <p>Build something with your Python or coding skills and get featured on SkillBridge.</p>
                <a className="button button-primary button-small" href="/rewards#submit-project">Submit a project <span className="arrow">↗</span></a>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="change-news-backdrop">
        <section className="get-involved-section" id="get-involved">
          <div className="section-wrap involved-inner">
            <div className="involved-heading">
              <SectionEyebrow>BE PART OF THE CHANGE</SectionEyebrow>
              <h2>Help build Ghana’s <span>digital future.</span></h2>
              <p>It takes a community to open opportunities. Your time, support or partnership can help a child take their next step.</p>
            </div>
            <div className="involved-grid">
              {involvement.map((item) => (
                <EnquiryButton
                  key={item.title}
                  className="involved-card"
                  enquiryType={item.enquiryType}
                  title={item.title}
                  description={item.description}
                >
                  <span className="involved-icon">{item.icon}</span>
                  <div className="involved-card-body">
                    <b>{item.title}</b>
                    <small>{item.text}</small>
                  </div>
                  <span className="involved-card-cta">Get started <Arrow /></span>
                </EnquiryButton>
              ))}
            </div>
          </div>
        </section>

        <section className="news-section section-wrap" id="news">
          <div>
            <SectionEyebrow>STORIES FROM OUR COMMUNITY</SectionEyebrow>
            <h2>Our <span>News Stories.</span></h2>
          </div>
          <div className="news-placeholder">
            <img
              className="news-image"
              src={news.image}
              alt="A young person using a tablet to explore digital learning"
            />
            <div className="news-date">SKILLBRIDGE JOURNAL</div>
            <h3>{news.title}</h3>
            <p>{news.excerpt}</p>
            <EnquiryButton className="text-link enquiry-plain" enquiryType="General enquiry">
              Connect with us <Arrow />
            </EnquiryButton>
          </div>
        </section>
      </div>

      <section className="contact-band" id="contact">
        <div className="section-wrap contact-inner">
          <div><SectionEyebrow>LET’S MAKE IT POSSIBLE</SectionEyebrow><h2>Bring technology learning to more children.</h2></div>
          <EnquiryButton
            className="button button-green"
            enquiryType="General enquiry"
            title="Start a conversation"
            description="Tell us what you have in mind — a programme, a partnership, or a question. We usually reply within two working days."
          >
            Start a conversation <Arrow />
          </EnquiryButton>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
