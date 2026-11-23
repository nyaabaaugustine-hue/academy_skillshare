import { tryDb } from "./db";
import { getFirebaseAdmin, sendFcmToTokens } from "./firebase-admin";

const VALID_STATUSES = new Set(["draft","scheduled","processing","completed","partially_completed","failed","cancelled"]);
const VALID_AUDIENCES = new Set(["all","selected_users","role"]);

// Notifications must only ever deep-link into the SkillBridge app / web app
// (native deep links like `skillbridge://...` or in-app web app routes such as
// `/app/index.html`, `/learn`). Public marketing pages are not valid targets.
const DEFAULT_APP_ACTION_URL = "/app/index.html";
const PUBLIC_NOTIFICATION_BLOCKED_PATHS = new Set([
  "/",
  "/about",
  "/programmes",
  "/leaderboard",
  "/rewards",
  "/team",
  "/contact",
  "/certificates",
  "/register",
  "/login",
]);

function isAppScopedActionUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return true; // no destination = use the default in-app route
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return true; // app deep link, e.g. skillbridge://notifications
  const path = (value.split("#")[0] || "").split("?")[0];
  const clean = path.startsWith("/") ? path : "";
  if (clean.startsWith("/api/")) return false;
  const firstSegment = clean.split("/").filter(Boolean)[0];
  if (firstSegment === "app" || firstSegment === "learn") return true; // in-app app/web-app routes
  if (PUBLIC_NOTIFICATION_BLOCKED_PATHS.has(clean)) return false; // public marketing page
  return false;
}

function resolveAppActionUrl(raw) {
  const value = String(raw || "").trim();
  return value && isAppScopedActionUrl(value) ? value : DEFAULT_APP_ACTION_URL;
}

export function campaignConfigured() {
  return true;
}

export async function createCampaign(input) {
  const sql = tryDb();
  if (!sql) throw new Error("Database unavailable");

  const title = String(input?.title || "").trim().slice(0, 160);
  const message = String(input?.message || "").trim().slice(0, 2000);
  if (!title || !message) throw new Error("Title and message are required.");

  const campaignName = input?.campaign_name ? String(input.campaign_name).trim().slice(0, 160) : null;
  const imageUrl = input?.image_url ? String(input.image_url).trim().slice(0, 1200) : null;
  const actionUrl = input?.action_url ? String(input.action_url).trim().slice(0, 500) : null;
  if (actionUrl && !isAppScopedActionUrl(actionUrl)) {
    throw new Error("action_url must be an app deep link or in-app route (e.g. /app/index.html or skillbridge://notifications). Public pages are not valid notification destinations.");
  }
  const category = String(input?.category || "general").trim().slice(0, 40);
  const audienceType = VALID_AUDIENCES.has(input?.audience_type) ? input.audience_type : "all";
  const audienceFilter = input?.audience_filter && typeof input.audience_filter === "object" ? input.audience_filter : {};
  const platformFilter = Array.isArray(input?.platform_filter) ? input.platform_filter : ["android","ios","web"];
  const scheduledAt = input?.scheduled_at ? new Date(input.scheduled_at) : null;
  const validScheduled = scheduledAt && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : null;
  const status = validScheduled ? "scheduled" : "draft";
  const createdBy = input?.created_by ? String(input.created_by).trim().slice(0, 200) : null;
  const idempotencyKey = input?.idempotency_key ? String(input.idempotency_key).trim().slice(0, 200) : null;

  const [row] = await sql`
    insert into notification_campaigns
      (campaign_name, title, message, image_url, action_url, category, audience_type, audience_filter, platform_filter, status, scheduled_at, created_by, idempotency_key)
    values
      (${campaignName}, ${title}, ${message}, ${imageUrl}, ${actionUrl}, ${category}, ${audienceType}, ${JSON.stringify(audienceFilter)}, ${JSON.stringify(platformFilter)}, ${status}, ${validScheduled}, ${createdBy}, ${idempotencyKey})
    returning *
  `;
  return row;
}

export async function listCampaigns({ limit = 50, offset = 0, status = null } = {}) {
  const sql = tryDb();
  if (!sql) return [];
  try {
    if (status) {
      return await sql`select * from notification_campaigns where status = ${status} order by created_at desc limit ${limit} offset ${offset}`;
    }
    return await sql`select * from notification_campaigns order by created_at desc limit ${limit} offset ${offset}`;
  } catch {
    return [];
  }
}

export async function getCampaign(id) {
  const sql = tryDb();
  if (!sql) return null;
  try {
    const rows = await sql`select * from notification_campaigns where id = ${id} limit 1`;
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function resolveAudience(campaign) {
  const sql = tryDb();
  if (!sql) return { users: [], devices: [] };
  const filter = campaign.audience_filter || {};
  const platforms = Array.isArray(campaign.platform_filter) ? campaign.platform_filter : ["android","ios","web"];

  let users = [];
  try {
    if (campaign.audience_type === "all") {
      users = await sql`select distinct user_id from user_devices where is_active = true`;
    } else if (campaign.audience_type === "selected_users") {
      const ids = Array.isArray(filter.user_ids) ? filter.user_ids : [];
      if (ids.length) users = ids.map((u) => ({ user_id: String(u) }));
    } else if (campaign.audience_type === "role") {
      // Reuse existing learners table if present; otherwise fall back to device owners.
      try {
        users = await sql`select distinct user_id from user_devices where is_active = true`;
      } catch { users = []; }
    } else {
      users = await sql`select distinct user_id from user_devices where is_active = true`;
    }
  } catch {
    users = [];
  }

  const userIds = [...new Set(users.map((u) => String(u.user_id || u)).filter(Boolean))];

  let devices = [];
  try {
    if (userIds.length) {
      devices = await sql`
        select ud.*, ud.id as device_id from user_devices ud
        where ud.is_active = true and ud.platform = any(${platforms}) and ud.user_id = any(${userIds})
      `;
    } else {
      devices = await sql`
        select ud.*, ud.id as device_id from user_devices ud
        where ud.is_active = true and ud.platform = any(${platforms})
      `;
    }
  } catch {
    devices = [];
  }

  return { users: userIds, devices };
}

export async function processCampaign(campaignId, createdBy = null) {
  const sql = tryDb();
  if (!sql) throw new Error("Database unavailable");

  // Idempotency: lock the campaign row.
  const rows = await sql`select * from notification_campaigns where id = ${campaignId} for update`;
  const campaign = rows[0];
  const actionUrl = resolveAppActionUrl(campaign?.action_url);
  if (!campaign) throw new Error("Campaign not found");
  if (campaign.status === "completed" || campaign.status === "cancelled") {
    return { ok: false, reason: "already_finished" };
  }
  if (campaign.status === "processing") {
    return { ok: false, reason: "already_processing" };
  }

  await sql`update notification_campaigns set status='processing', updated_at=now() where id=${campaignId}`;

  const { users, devices } = await resolveAudience(campaign);

  await sql`update notification_campaigns set targeted_users=${users.length}, targeted_devices=${devices.length}, updated_at=now() where id=${campaignId}`;

  // Create persistent notification records per user (dedup by campaign+user).
  const userSet = new Set(users);
  const notificationIdByUser = new Map();
  for (const uid of userSet) {
    try {
      const existing = await sql`select id from notifications where user_id=${uid} and campaign_id is not null and campaign_id=${campaignId} limit 1`;
      if (existing[0]) { notificationIdByUser.set(uid, existing[0].id); continue; }
      const [n] = await sql`
        insert into notifications (user_id, title, body, type, link)
        values (${uid}, ${campaign.title}, ${campaign.message}, ${campaign.category}, ${actionUrl})
        returning id
      `;
      // Store campaign_id via update since notifications table may not have campaign_id column; add if missing.
      try { await sql`update notifications set campaign_id=${campaignId} where id=${n.id}`; } catch {}
      notificationIdByUser.set(uid, n.id);
    } catch {}
  }

  // Send push via FCM to devices.
  let success = 0;
  let failure = 0;
  const admin = getFirebaseAdmin();
  const tokens = devices.map((d) => d.fcm_token).filter(Boolean);

  if (admin && tokens.length) {
    const pushResult = await sendFcmToTokens(tokens, {
      title: campaign.title,
      body: campaign.message,
      imageUrl: campaign.image_url,
      link: actionUrl,
      type: campaign.category,
    });

    const tokenToResult = new Map((pushResult.results || []).map((r) => [r.token, r]));
    for (const dev of devices) {
      const r = tokenToResult.get(dev.fcm_token);
      const status = r?.ok ? "accepted_by_fcm" : (r?.error === "messaging/registration-token-not-registered" ? "invalid_token" : "failed");
      if (r?.ok) success += 1; else failure += 1;
      try {
        await sql`
          insert into notification_deliveries (campaign_id, notification_id, device_id, user_id, delivery_status, provider_message_id, error_code, error_message, attempt_count, attempted_at, delivered_at)
          values (${campaignId}, ${notificationIdByUser.get(dev.user_id) || null}, ${dev.device_id || dev.id}, ${dev.user_id}, ${status}, ${r?.messageId || null}, ${r?.error || null}, ${r?.error || null}, 1, now(), ${r?.ok ? new Date() : null})
        `;
      } catch {}
      if (status === "invalid_token") {
        try { await sql`update user_devices set is_active=false, updated_at=now() where id=${dev.device_id || dev.id}`; } catch {}
      }
    }
  } else {
    // No FCM: record pending deliveries for VAPID fallback (best-effort, skip)
    failure = 0;
  }

  const fcmReady = Boolean(admin && tokens.length > 0);
  const finalStatus = !fcmReady ? (tokens.length ? "failed" : "completed") : (failure === 0 ? "completed" : (success > 0 ? "partially_completed" : "failed"));
  await sql`
    update notification_campaigns
    set status=${finalStatus}, sent_at=now(), success_count=${success}, failure_count=${failure}, updated_at=now()
    where id=${campaignId}
  `;

  return { ok: true, targeted_users: users.length, targeted_devices: devices.length, success, failure, status: finalStatus };
}

export async function cancelCampaign(id) {
  const sql = tryDb();
  if (!sql) throw new Error("Database unavailable");
  await sql`update notification_campaigns set status='cancelled', updated_at=now() where id=${id} and status in ('draft','scheduled')`;
  return { ok: true };
}

export async function retryCampaign(id) {
  const sql = tryDb();
  if (!sql) throw new Error("Database unavailable");
  const rows = await sql`select * from notification_campaigns where id=${id} limit 1`;
  const c = rows[0];
  if (!c) throw new Error("Not found");
  if (c.status !== "partially_completed" && c.status !== "failed") throw new Error("Only failed/partial campaigns can be retried");
  await sql`update notification_campaigns set status='scheduled', scheduled_at=null, updated_at=now() where id=${id}`;
  return { ok: true };
}

export async function getCampaignAnalytics(id) {
  const sql = tryDb();
  if (!sql) return null;
  try {
    const campaign = await getCampaign(id);
    const deliveries = await sql`select delivery_status, count(*)::int as count from notification_deliveries where campaign_id=${id} group by delivery_status`;
    const unread = await sql`select count(*)::int as count from notifications where campaign_id=${id} and read_at is null`;
    const read = await sql`select count(*)::int as count from notifications where campaign_id=${id} and read_at is not null`;
    return { campaign, deliveries, unread: unread[0]?.count || 0, read: read[0]?.count || 0 };
  } catch {
    return null;
  }
}

export async function processScheduledCampaigns() {
  const sql = tryDb();
  if (!sql) return { processed: 0 };
  let processed = 0;
  try {
    const due = await sql`
      select id from notification_campaigns
      where status='scheduled' and scheduled_at is not null and scheduled_at <= now()
      order by scheduled_at asc
      limit 10
      for update skip locked
    `;
    for (const row of due) {
      try {
        await processCampaign(row.id);
        processed += 1;
      } catch {}
    }
  } catch {}
  return { processed };
}
