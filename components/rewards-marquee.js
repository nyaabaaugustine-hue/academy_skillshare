/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_REWARDS = [
  { title: "Branded Pencil", detail: "Earned for completing your first learning step.", image: "/rewards/pencil.png", icon: "✏️", tag: "Stationery" },
  { title: "Learner T-Shirt", detail: "Worn by project builders and top performers.", image: "https://res.cloudinary.com/z43ds8bn/image/upload/v1795422003/Education_Tech_Logo_T-Shirt_Mockup_1.png", icon: "👕", tag: "Wearables" },
  { title: "SkillBridge Notebook", detail: "A place to plan, sketch, and capture your ideas.", image: "https://res.cloudinary.com/z43ds8bn/image/upload/v1795421286/Blue_Tech_Education_Journal_Mockup.png", icon: "📓", tag: "Stationery", whiteMedia: true },
  { title: "Digital Certificate", detail: "Shareable proof of your milestones and progress.", image: "https://res.cloudinary.com/z43ds8bn/image/upload/v1795422288/businessman-standing-top-view_1116086-20307.jpg", icon: "📜", tag: "Certificates" },
  { title: "Top Learner Trophy", detail: "Celebrating standout performance on the leaderboard.", image: "/rewards/trophy.png", icon: "🏆", tag: "Awards" },
  { title: "Lapel Pins", detail: "Collectible SkillBridge pins to show off your progress.", image: "/rewards/pins.png", icon: "📌", tag: "Swag" },
];

function RewardCard({ item }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <article className="rewards-marquee-card">
      <div className="rewards-marquee-media" style={item.whiteMedia ? { background: "#fff" } : undefined}>
        {!imgFailed && item.image ? (
          <img src={item.image} alt={item.title} loading="lazy" onError={() => setImgFailed(true)} />
        ) : (
          <span className="rewards-marquee-fallback" aria-hidden="true">{item.icon}</span>
        )}
        <span className="rewards-marquee-tag">{item.tag}</span>
      </div>
      <div className="rewards-marquee-body">
        <h3>{item.title}</h3>
        <p>{item.detail}</p>
      </div>
    </article>
  );
}

export default function RewardsMarquee({ rewards }) {
  const base = rewards && rewards.length > 0 ? rewards : DEFAULT_REWARDS;
  const trackRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const track = trackRef.current;
    if (!track) return undefined;
    let raf = 0;
    let last = 0;
    let offset = 0;
    const speed = 24;

    const step = (ts) => {
      if (!last) last = ts;
      const dt = (ts - last) / 1000;
      last = ts;
      if (!paused && !document.hidden) {
        offset += speed * dt;
        const half = track.scrollWidth / 2;
        if (half > 0 && offset >= half) offset -= half;
        track.style.transform = `translate3d(${-offset}px,0,0)`;
      }
      raf = window.requestAnimationFrame(step);
    };
    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [paused, reduceMotion]);

  const items = [...base, ...base];

  return (
    <section className="rewards-marquee-section" aria-label="SkillBridge rewards">
      <div className="section-wrap">
        <div className="rewards-marquee-heading">
          <div>
            <div className="eyebrow"><span />REWARDS IN MOTION</div>
            <h2>Premium rewards for <span>real progress.</span></h2>
            <p>
              Every milestone unlocks something tangible. From branded stationery to certificates and t-shirts,
              rewards celebrate the effort behind the learning.
            </p>
            <div style={{ marginTop: 12 }}>
              <a className="button button-outline button-small" href="https://res.cloudinary.com/z43ds8bn/image/upload/v1795421661/SkillBridge_Academy_Python_Certificate_1.png" target="_blank" rel="noreferrer">
                View sample certificate ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      <div
        className="rewards-marquee"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="rewards-marquee-track" ref={trackRef}>
          {items.map((item, i) => (
            <div
              className="rewards-marquee-slide"
              key={`${item.title}-${i}`}
              aria-hidden={i >= base.length ? "true" : undefined}
            >
              <RewardCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
