import { getSiteUrl } from "../lib/site-url";

export const revalidate = 3600;

export default function sitemap() {
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

  return urls;
}
