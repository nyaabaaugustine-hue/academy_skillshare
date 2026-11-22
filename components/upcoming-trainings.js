/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import EnquiryButton from "./enquiry-popup";

const ITEMS = [
  {
    type: "BOOTCAMP",
    title: "Python Coding Bootcamp",
    date: "June 2026",
    duration: "4 weeks",
    format: "Hybrid",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    description:
      "A hands-on bootcamp for young learners to build real projects with Python, logic, and problem-solving.",
  },
  {
    type: "TRAINING",
    title: "Web Design Fundamentals",
    date: "July 2026",
    duration: "3 weeks",
    format: "Online + in person",
    image:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    description:
      "Learn how websites are structured and styled while creating beautiful, responsive pages from scratch.",
  },
  {
    type: "BOOTCAMP",
    title: "Robotics & IoT Starter Lab",
    date: "August 2026",
    duration: "5 weeks",
    format: "In person",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    description:
      "Build, wire, and program simple smart devices while exploring robotics, sensors, and creative engineering.",
  },
  {
    type: "TRAINING",
    title: "AI for Young Innovators",
    date: "September 2026",
    duration: "2 weeks",
    format: "Hybrid",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    description:
      "An age-appropriate introduction to AI concepts, responsible use, and creative projects with real-world impact.",
  },
];

function Card({ item }) {
  return (
    <article className="upcoming-card">
      <div className="upcoming-card-media">
        <img src={item.image} alt={item.title} loading="lazy" />
        <span className="upcoming-card-type">{item.type}</span>
      </div>
      <div className="upcoming-card-body">
        <div className="upcoming-card-meta">
          <span>{item.date}</span>
          <span>{item.duration}</span>
          <span>{item.format}</span>
        </div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <EnquiryButton
          className="button button-primary upcoming-card-btn"
          enquiryType="Programmes and courses"
          programme={item.title}
          title={`Register for ${item.title}`}
          description={`Share your details and our team will send you registration information for ${item.title}.`}
        >
          View &amp; register <span aria-hidden="true" className="arrow">↗</span>
        </EnquiryButton>
      </div>
    </article>
  );
}

export default function UpcomingTrainings() {
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
    const speed = 28; // px per second, slow/premium

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

  const items = [...ITEMS, ...ITEMS];

  return (
    <section className="upcoming-section" id="upcoming-trainings">
      <div className="section-wrap">
        <div className="upcoming-heading">
          <div>
            <div className="eyebrow"><span />UPCOMING TRAININGS &amp; BOOTCAMPS</div>
            <h2>Learn by doing. <span>Grow by building.</span></h2>
            <p>
              Explore upcoming trainings and bootcamps designed to give young learners practical,
              guided experience in technology and innovation.
            </p>
          </div>
          <div className="upcoming-heading-note">
            <span className="upcoming-live-dot" aria-hidden="true" />
            Registration open
          </div>
        </div>
      </div>

      <div
        className="upcoming-marquee"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div className="upcoming-track" ref={trackRef}>
          {items.map((item, i) => (
            <div
              className="upcoming-slide"
              key={`${item.title}-${i}`}
              aria-hidden={i >= ITEMS.length ? "true" : undefined}
              inert={i >= ITEMS.length ? "" : undefined}
            >
              <Card item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
