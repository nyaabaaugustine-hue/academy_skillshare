import { getUpcomingTrainings } from "../lib/content";
import { getSiteUrl } from "../lib/site-url";

export const revalidate = 3600;

export default async function sitemap() {
  const base = getSiteUrl().replace(/\/$/, "");
  const lastModified = new Date();

  const staticPaths = [
    "/",
    "/about",
    "/programmes",
    "/playground",
    "/leaderboard",
    "/rewards",
    "/team",
    "/contact",
    "/settings",
    "/tutor",
    "/account",
    "/register",
    "/login",
    "/certificates",
  ];

  const urls = staticPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  try {
    const trainings = await getUpcomingTrainings();
    for (const training of trainings || []) {
      if (training?.slug) {
        urls.push({
          url: `${base}/trainings/${training.slug}`,
          lastModified,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // Sitemap must never fail the build because training data is unavailable.
  }

  return urls;
}
