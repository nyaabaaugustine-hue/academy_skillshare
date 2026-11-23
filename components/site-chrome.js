"use client";
/* eslint-disable @next/next/no-html-link-for-pages, @next/next/no-img-element */

import InstallAppButton from "./install-app-button";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.skillbridgeacademy.tech").replace(/\/$/, "");
const pwaUrl = `${appUrl}/app/index.html?v=2`;

function Brand() {
  return (
    <a className="brand" href="/" aria-label="SkillBridge home">
      <span className="brand-mark"><img src="https://res.cloudinary.com/z43ds8bn/image/upload/v1795200948/WhatsApp_Image_2026-11-16_at_7.25.58_AM.jpg" alt="" /></span>
      <span className="brand-copy">
        <strong>SkillBridge</strong>
        <small>Digital Talent &amp; Outsourcing Academy</small>
      </span>
    </a>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/about">About us</a>
          <a href="/programmes">Programmes</a>
          <a href="/leaderboard">Leaderboard</a>
          <a href="/notifications">Notifications</a>
          <a href="/settings">Settings</a>
          <a href="/rewards">Rewards</a>
          <a href="/team">Our team</a>
          <a href="/contact">Contact</a>
        </nav>
        <div className="auth-actions">
          <a className="button button-outline button-small" href={pwaUrl}>Register</a>
          <a className="button button-primary button-small" href={pwaUrl}>Login</a>
        </div>
        <details className="mobile-menu" onClick={(e) => { if (e.target.closest("a")) e.currentTarget.removeAttribute("open"); }}>
          <summary aria-label="Open navigation"><span></span><span></span><span></span></summary>
          <nav aria-label="Mobile navigation">
            <a href="/">Home</a><a href="/about">About us</a>
            <a href="/programmes">Programmes</a><a href="/leaderboard">Leaderboard</a><a href="/settings">Settings</a>
            <a href="/rewards">Rewards</a><a href="/team">Our team</a>
            <a href="/contact">Contact</a>
            <div className="mobile-auth-row">
              <a href={pwaUrl}>Register</a>
              <a href={pwaUrl}>Login</a>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}

function LocationMapSection() {
  return (
    <section className="location-map-section" aria-labelledby="location-map-heading">
      <div className="section-wrap location-map-inner">
        <div className="location-map-copy">
          <div className="eyebrow"><span />WHERE TO FIND US</div>
          <h2 id="location-map-heading">A global mission, <span>rooted in Ghana.</span></h2>
          <p>We work with learners, families, schools and partners across borders — with our learning community anchored in Kumasi - Wiamoase, Ashanti.</p>
          <div className="location-map-locations">
            <div className="location-map-location"><img className="location-flag" src="https://flagcdn.com/w40/gh.png" alt="Ghana flag" width={20} height={15} loading="lazy" /><div><b>Ghana</b><small>Kumasi - Wiamoase, Ashanti</small></div></div>
<div className="location-map-location"><img className="location-flag" src="https://flagcdn.com/w40/be.png" alt="Belgium flag" width={20} height={15} loading="lazy" /><div><b>Belgium</b></div></div>
<div className="location-map-location"><img className="location-flag" src="https://flagcdn.com/w40/us.png" alt="USA flag" width={20} height={15} loading="lazy" /><div><b>USA</b></div></div>
            
            
          </div>
          <a className="button button-primary" href="https://www.google.com/maps/search/?api=1&query=Kumasi%20Wiamoase%2C%20Ashanti" target="_blank" rel="noreferrer">Open in Google Maps <span className="arrow">↗</span></a>
        </div>
        <div className="location-map-frame">
          <iframe
            title="SkillBridge Academy location in Kumasi - Wiamoase, Ashanti, Ghana"
            src="https://www.google.com/maps?q=Kumasi+Wiamoase,+Ashanti,+Ghana&output=embed"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <div className="location-map-badge">
            <span className="map-pin">⌖</span>
            <span><b>Kumasi - Wiamoase, Ashanti</b><small>Ghana</small></span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ showMap = true } = {}) {
  return (
    <>
      {showMap ? <LocationMapSection /> : null}
      <footer className="site-footer">
        <div className="footer-main section-wrap">
          <div className="footer-brand">
            <Brand />
            <p>Empowering young people in Ghana through accessible technology education, creativity and practical skills.</p>
            <div className="socials">
              <a href="/contact" aria-label="Facebook">f</a><a href="/contact" aria-label="Instagram">◎</a>
              <a href="/contact" aria-label="LinkedIn">in</a><a href="/contact" aria-label="YouTube">▶</a>
            </div>
          </div>
          <div><h4>Explore</h4><a href="/about">About us</a><a href="/programmes">Our programmes</a><a href="/leaderboard">Leaderboard</a><a href="/settings">Settings</a><a href="/rewards">Rewards</a><a href="/team">Our team</a></div>
          <div><h4>Get involved</h4><a href="/contact">Volunteer</a><a href="/contact">Partner with us</a><a href="/contact">Donate</a><a href="/contact">Support a school</a><InstallAppButton className="text-link" label="Install app" /></div>
          <div><h4>Contact</h4><p className="location-flags-inline"><span><img className="location-flag" src="https://flagcdn.com/w40/be.png" alt="Belgium flag" width={20} height={15} loading="lazy" />Belgium</span><span><img className="location-flag" src="https://flagcdn.com/w40/us.png" alt="USA flag" width={20} height={15} loading="lazy" />USA</span><span><img className="location-flag" src="https://flagcdn.com/w40/gh.png" alt="Ghana flag" width={20} height={15} loading="lazy" />Ghana</span></p><a href="mailto:support@skillbridgeacademy.tech">support@skillbridgeacademy.tech</a><a href="mailto:info@skillbridgeacademy.tech">info@skillbridgeacademy.tech</a></div>
        </div>
        <div className="footer-bottom section-wrap">
          <span>© {new Date().getFullYear()} SkillBridge. All rights reserved.</span>
          <div><a href="/contact">Privacy</a><a href="/contact">Child safeguarding</a><a href="/contact">Terms</a></div>
          <b>LEARN TODAY. INNOVATE TOMORROW.</b>
        </div>
      </footer>
    </>
  );
}
