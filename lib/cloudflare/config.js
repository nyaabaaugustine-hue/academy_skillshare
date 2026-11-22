/**
 * Cloudflare free-tier configuration.
 *
 * Everything here is server-side only. Public values (Turnstile site key,
 * Web Analytics token) are exposed deliberately and separately from secrets.
 */

export function cloudflareConfig() {
  const env = process.env;
  return {
    accountId: (env.CLOUDFLARE_ACCOUNT_ID || "").trim(),
    apiToken: (env.CLOUDFLARE_API_TOKEN || "").trim(),
    workerUrl: (env.TUTOR_WORKER_URL || "").trim(),
    r2: {
      accessKeyId: (env.CLOUDFLARE_R2_ACCESS_KEY_ID || "").trim(),
      secretAccessKey: (env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "").trim(),
      bucket: (env.CLOUDFLARE_R2_BUCKET || "").trim(),
      endpoint: (env.CLOUDFLARE_R2_ENDPOINT || "").trim(),
    },
    turnstile: {
      siteKey: (env.CLOUDFLARE_TURNSTILE_SITE_KEY || "").trim(),
      secretKey: (env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "").trim(),
      enabled: Boolean((env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "").trim()),
    },
    aiGateway: (env.CLOUDFLARE_AI_GATEWAY_ID || "").trim(),
    analyticsToken: (env.CLOUDFLARE_WEB_ANALYTICS_TOKEN || "").trim(),
  };
}

export function cloudflareServiceStatus() {
  const c = cloudflareConfig();
  return {
    workers: Boolean(c.accountId && c.apiToken),
    tutorWorker: Boolean(c.workerUrl),
    r2: Boolean(c.r2.accessKeyId && c.r2.secretAccessKey && c.r2.bucket && c.r2.endpoint),
    turnstile: Boolean(c.turnstile.siteKey && c.turnstile.secretKey),
    aiGateway: Boolean(c.aiGateway),
    analytics: Boolean(c.analyticsToken),
    usageApi: Boolean(c.accountId && c.apiToken),
  };
}
