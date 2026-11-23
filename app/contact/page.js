/* eslint-disable @next/next/no-img-element */
import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import EnquiryButton from "../../components/enquiry-popup";

export const metadata = {
  title: "Contact | SkillBridge",
  description: "Get in touch with SkillBridge about programmes, partnerships and volunteering."
};

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero contact-hero" style={{ backgroundImage: "linear-gradient(rgba(7,31,73,0.62), rgba(7,31,73,0.62)), url('https://res.cloudinary.com/z43ds8bn/image/upload/v1795345421/Modern_Educational_Tech_Wave_Banner.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
          <div className="inner-hero-content">
            <div className="eyebrow"><span />LET’S CONNECT</div>
            <h1>Let’s open more doors <em>together.</em></h1>
            <p>Ask us about programmes, volunteering, partnerships or bringing technology learning to your community.</p>
            <div className="hero-actions">
              <EnquiryButton className="button button-green" enquiryType="General enquiry" title="Email our team" description="Send us a message about programmes, volunteering, partnerships or bringing technology learning to your community.">
                Send a message <span className="arrow">→</span>
              </EnquiryButton>
              <a className="button button-glass" href="/programmes">View programmes <span className="arrow">→</span></a>
            </div>
          </div>
        </section>

        <section className="section-wrap ip-stats" aria-label="Contact highlights">
          <article className="ip-stat"><strong>Fast</strong><b>Friendly response</b><p>We aim to respond to enquiries as quickly as possible.</p></article>
          <article className="ip-stat"><strong>Schools</strong><b>Partnerships</b><p>Bring digital learning to your school or community.</p></article>
          <article className="ip-stat"><strong>Families</strong><b>Programme guidance</b><p>We’ll help you find the right pathway for a learner.</p></article>
          <article className="ip-stat"><strong>Global</strong><b>Ghana + partners</b><p>Rooted in Ghana, collaborating across borders.</p></article>
        </section>

        <section className="inner-content section-wrap contact-page-content">
          <div className="contact-details">
            <div className="eyebrow"><span />SAY HELLO</div>
            <h2>We’d love to hear from you.</h2>
            <p>Start a conversation with our team and tell us how you would like to get involved. Whether you’re a parent, school, partner, or volunteer, we’re here to help.</p>
            <div className="contact-detail"><span className="contact-detail-icon">✉</span><span><small>EMAIL</small><b><a href="mailto:support@skillbridgeacademy.tech">support@skillbridgeacademy.tech</a></b><b><a href="mailto:info@skillbridgeacademy.tech">info@skillbridgeacademy.tech</a></b></span></div>
            <div className="contact-detail"><span className="contact-detail-icon">⌖</span><span><small>LOCATIONS</small><b><img className="location-flag" src="https://flagcdn.com/w40/be.png" alt="Belgium flag" width={20} height={15} loading="lazy" />Belgium</b><b><img className="location-flag" src="https://flagcdn.com/w40/us.png" alt="USA flag" width={20} height={15} loading="lazy" />USA</b><b><img className="location-flag" src="https://flagcdn.com/w40/gh.png" alt="Ghana flag" width={20} height={15} loading="lazy" />Ghana — East Legon, Accra</b></span></div>
            <div className="contact-detail"><span className="contact-detail-icon">⏱</span><span><small>WHAT TO EXPECT</small><b>Clear next steps</b><span style={{ fontSize: 12, color: "var(--muted)" }}>Share your goal and we’ll point you to the right programme or partnership path.</span></span></div>
            <div className="hero-actions" style={{ marginTop: 20 }}>
              <EnquiryButton className="button button-primary" enquiryType="General enquiry" title="Contact SkillBridge" description="Tell us how we can help.">Send enquiry <span className="arrow">→</span></EnquiryButton>
              <a className="button button-outline" href="https://www.google.com/maps/search/?api=1&query=East%20Legon%2C%20Accra" target="_blank" rel="noreferrer">Open in Google Maps</a>
            </div>
          </div>
          <div className="map-frame">
            <iframe
              title="SkillBridge headquarters area in East Legon, Accra, Ghana"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31764.227970961805!2d-0.17891519465508338!3d5.636380888057941!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9b501278f4a5%3A0xca081548a0c20ffd!2sEast%20Legon%2C%20Accra!5e0!3m2!1sen!2sgh!4v1795202672969!5m2!1sen!2sgh"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <div className="map-caption"><span className="map-pin">⌖</span><span><b>East Legon, Accra</b><small className="location-flags-inline"><span><img className="location-flag" src="https://flagcdn.com/w40/be.png" alt="Belgium flag" width={20} height={15} loading="lazy" />Belgium</span><span><img className="location-flag" src="https://flagcdn.com/w40/us.png" alt="USA flag" width={20} height={15} loading="lazy" />USA</span><span><img className="location-flag" src="https://flagcdn.com/w40/gh.png" alt="Ghana flag" width={20} height={15} loading="lazy" />Ghana</span></small></span></div>
          </div>
        </section>
      </main>
      <SiteFooter showMap={false} />
    </>
  );
}
