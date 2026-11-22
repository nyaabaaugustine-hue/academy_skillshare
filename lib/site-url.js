export function getSiteUrl() {
  const explicit = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = (process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "").trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "https://www.skillbridgeacademy.tech";
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  const p = String(path || "/");
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
}
