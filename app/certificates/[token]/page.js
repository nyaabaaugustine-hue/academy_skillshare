import { notFound } from "next/navigation";

import { SiteFooter, SiteHeader } from "../../../components/site-chrome";
import ShareActions from "../../../components/share-actions";
import { getAwardByToken } from "../../../lib/awards";
import { absoluteUrl } from "../../../lib/site-url";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { token } = await params;
  const award = await getAwardByToken(token);
  if (!award || !award.public_share) {
    return { title: "Certificate | SkillBridge Academy", robots: { index: false, follow: false } };
  }
  const title = `${award.learner_alias || award.learner_name} earned a SkillBridge certificate`;
  const description = award.award_detail || award.award_title;
  const url = `/certificates/${award.share_token}`;
  return {
    title: `${award.award_title} | SkillBridge Academy`,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", siteName: "SkillBridge Academy" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CertificatePage({ params }) {
  const { token } = await params;
  const award = await getAwardByToken(token);
  if (!award) notFound();

  const isPublic = Boolean(award.public_share);
  const name = award.learner_alias || award.learner_name || "SkillBridge Learner";
  const shareUrl = absoluteUrl(`/certificates/${award.share_token}`);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero certificate-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />SKILLBRIDGE CERTIFICATE</div>
            <h1>Learning <em>recognized.</em></h1>
            <p>A shareable certificate celebrating real learning progress and skill-building.</p>
          </div>
        </section>

        <section className="inner-content section-wrap">
          {!isPublic ? (
            <div className="showcase-empty"><h3>This certificate is private</h3><p>Guardian consent or public sharing is not enabled for this award.</p></div>
          ) : (
            <div className="certificate-layout">
              <article className="certificate-card" aria-label="SkillBridge certificate">
                <div className="certificate-badge">SkillBridge Academy</div>
                <p className="certificate-kicker">Certificate of Achievement</p>
                <h2>{name}</h2>
                <p className="certificate-award">{award.award_title}</p>
                <p className="certificate-detail">{award.award_detail || "Recognized for learning progress, practice, and skill-building at SkillBridge Academy."}</p>
                <div className="certificate-meta">
                  <div><small>Issued</small><b>{new Date(award.issued_at).toLocaleDateString()}</b></div>
                  <div><small>Award type</small><b>{award.award_type}</b></div>
                  <div><small>Status</small><b>{award.status}</b></div>
                </div>
                <div className="certificate-footer">
                  <span>Learn Today. Innovate Tomorrow.</span>
                  <span>skillbridgeacademy.tech</span>
                </div>
              </article>

              <aside className="certificate-side">
                <div className="leaderboard-side-card">
                  <h3>Share this achievement</h3>
                  <p>Celebrate this learner’s progress with family, mentors, and community.</p>
                  <ShareActions url={shareUrl} text={`${name} earned a SkillBridge certificate: ${award.award_title}`} title="Share certificate" />
                </div>
                <div className="leaderboard-side-card">
                  <h3>Keep building</h3>
                  <p>Explore rewards, see the leaderboard, and discover what learners can build next.</p>
                  <div className="hero-actions">
                    <a className="button button-primary button-small" href="/rewards">Rewards <span className="arrow">↗</span></a>
                    <a className="button button-ghost button-small" href="/leaderboard">Leaderboard <span className="arrow">↗</span></a>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
