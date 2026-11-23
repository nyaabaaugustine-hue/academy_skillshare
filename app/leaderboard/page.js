/* eslint-disable @next/next/no-img-element */
import { SiteFooter, SiteHeader } from "../../components/site-chrome";
import ShareActions from "../../components/share-actions";
import { listLeaderboard } from "../../lib/server/leaderboard";
import { absoluteUrl } from "../../lib/site-url";

export const metadata = {
  title: "Leaderboard | SkillBridge Academy",
  description: "See top SkillBridge learners ranked by learning progress, practice, and score.",
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    title: "SkillBridge Learner Leaderboard",
    description: "Celebrate learners who show up, practice, complete steps, and build real skills.",
    url: "/leaderboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillBridge Learner Leaderboard",
    description: "Celebrate learners who show up, practice, complete steps, and build real skills.",
  },
};

export const revalidate = 60;

function rankBadge(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export default async function LeaderboardPage() {
  let entries = [];
  let error = "";
  try {
    entries = await listLeaderboard(50);
  } catch (e) {
    error = e instanceof Error ? e.message : "The leaderboard is unavailable right now.";
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="inner-hero leaderboard-hero">
          <div className="inner-hero-content">
            <div className="eyebrow"><span />LEARNER LEADERBOARD</div>
            <h1>See who’s leading the <em>learning journey.</em></h1>
            <p>
              Our leaderboard celebrates learners who show up, practice, complete steps, and build real skills.
              Every point represents progress.
            </p>
            <div className="hero-actions">
              <a className="button button-green" href="/rewards">View rewards <span className="arrow">→</span></a>
              <a className="button button-glass" href="/programmes">Explore programmes <span className="arrow">→</span></a>
            </div>
            <div className="hero-share-wrap">
              <ShareActions url={absoluteUrl("/leaderboard")} text="See who’s leading the learning journey on the SkillBridge Academy leaderboard!" title="Share leaderboard" />
            </div>
          </div>
        </section>

        <section className="section-wrap ip-stats" aria-label="Leaderboard highlights">
          <article className="ip-stat"><strong>{entries.length}</strong><b>Ranked learners</b><p>Learners currently on the board.</p></article>
          <article className="ip-stat"><strong>Score</strong><b>Points earned</b><p>Total progress across completed steps.</p></article>
          <article className="ip-stat"><strong>Practice</strong><b>Skills built</b><p>Challenges completed build confidence.</p></article>
          <article className="ip-stat"><strong>Rewards</strong><b>Milestones</b><p>Progress can unlock recognition and prizes.</p></article>
        </section>

        <section className="inner-content section-wrap">
          <div className="leaderboard-layout">
            <div className="leaderboard-main">
              <div className="inner-section-heading">
                <div className="eyebrow"><span />TOP LEARNERS</div>
                <h2>Ranking board</h2>
              </div>

              {error ? (
                <p className="admin-alert admin-alert-error" role="alert">{error}</p>
              ) : entries.length === 0 ? (
                <p className="admin-empty">No learners on the leaderboard yet. Be the first to complete a step and earn your place.</p>
              ) : (
                <div className="leaderboard-table-wrap">
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Learner</th>
                        <th>Score</th>
                        <th>Steps</th>
                        <th>Practices</th>
                        <th>Avg</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className={entry.rank <= 3 ? `is-top-${entry.rank}` : undefined}>
                          <td className="lb-rank">{rankBadge(entry.rank)}</td>
                          <td>
                            <div className="lb-learner">
                              <img
                                src={`/api/leaderboard/avatar/${encodeURIComponent(entry.id)}`}
                                alt=""
                                width={36}
                                height={36}
                                className="lb-avatar"
                              />
                              <span>
                                <b>{entry.name}</b>
                                <small>{entry.source === "app" ? "App learner" : "Web learner"}</small>
                              </span>
                            </div>
                          </td>
                          <td><b>{entry.score}</b></td>
                          <td>{entry.stepsCompleted}</td>
                          <td>{entry.practicesCompleted}</td>
                          <td>{entry.average}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="leaderboard-side">
              <div className="leaderboard-side-card">
                <h3>How ranking works</h3>
                <ul>
                  <li><b>Score</b> — total points earned across completed steps.</li>
                  <li><b>Steps</b> — lessons and activities completed.</li>
                  <li><b>Practices</b> — coding/practice challenges completed.</li>
                  <li><b>Tie-breaker</b> — higher steps, then earlier achievement.</li>
                </ul>
              </div>
              <div className="leaderboard-side-card">
                <h3>Earn recognition</h3>
                <p>Reach milestones, build projects, and get featured on SkillBridge.</p>
                <a className="button button-primary button-small" href="/rewards">View rewards <span className="arrow">↗</span></a>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
