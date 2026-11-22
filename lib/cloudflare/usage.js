import { cloudflareConfig, cloudflareServiceStatus } from "./config.js";

/**
 * Free-tier usage guard.
 *
 * Cloudflare's GraphQL Analytics API is used only when an account id + token are
 * configured. Any failure degrades to "unknown" with manual dashboard links.
 * This module never enables billing, never upgrades a plan and never calls a
 * paid-only API.
 */

const GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";

export const DEFAULT_THRESHOLDS = {
  workerRequestsDaily: 100_000,
  aiNeuronsDaily: 10_000,
  r2StorageGb: 10,
  warnAt: 0.8,
};

async function graphql(query, variables) {
  const { accountId, apiToken } = cloudflareConfig();
  if (!accountId || !apiToken) return { ok: false, reason: "not_configured" };
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const data = await res.json().catch(() => null);
    if (!data || data.errors?.length) {
      return { ok: false, reason: "graphql_error", errors: data?.errors ?? [] };
    }
    return { ok: true, data: data.data };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

export async function getCloudflareUsage() {
  const status = cloudflareServiceStatus();
  const { accountId } = cloudflareConfig();

  if (!status.usageApi || !accountId) {
    return {
      ok: false,
      reason: "not_configured",
      status,
      thresholds: DEFAULT_THRESHOLDS,
      usage: null,
      dashboardUrl: "https://dash.cloudflare.com/",
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const query = `
    query Usage($accountTag: String!, $since: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersInvocationsAdaptive(limit: 1, filter: { datetime_geq: $since }) {
            sum { requests errors }
          }
        }
      }
    }
  `;

  const result = await graphql(query, { accountTag: accountId, since });
  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason,
      status,
      thresholds: DEFAULT_THRESHOLDS,
      usage: null,
      dashboardUrl: `https://dash.cloudflare.com/${accountId}`,
    };
  }

  const account = result.data?.viewer?.accounts?.[0];
  const workers = account?.workersInvocationsAdaptive?.[0]?.sum ?? null;
  const requests = Number(workers?.requests || 0);
  const ratio = requests / DEFAULT_THRESHOLDS.workerRequestsDaily;

  return {
    ok: true,
    status,
    thresholds: DEFAULT_THRESHOLDS,
    usage: { workerRequests24h: requests, workerErrors24h: Number(workers?.errors || 0) },
    warning: ratio >= DEFAULT_THRESHOLDS.warnAt,
    ratio,
    dashboardUrl: `https://dash.cloudflare.com/${accountId}`,
  };
}
