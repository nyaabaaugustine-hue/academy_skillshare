/**
 * Public Cloudflare values only. Safe to import from client components.
 * Never add secrets here.
 */
export function cloudflarePublicConfig() {
  return {
    turnstileSiteKey: (process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "").trim(),
    analyticsToken: (process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN || "").trim(),
  };
}
