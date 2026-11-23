import { getSiteUrl } from "../lib/site-url";

export default function robots() {
  const base = getSiteUrl().replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/app/", "/_next/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
