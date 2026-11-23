import { NextResponse } from "next/server";

import { assertAdmin } from "@/lib/admin-auth";
import { createCampaign, listCampaigns } from "@/lib/notification-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);
  const status = searchParams.get("status");

  const rows = await listCampaigns({ limit, offset, status });
  return json({ ok: true, campaigns: rows });
}

export async function POST(request) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  let payload;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

  try {
    const campaign = await createCampaign({ ...payload, created_by: "admin" });
    return json({ ok: true, campaign }, 201);
  } catch (e) {
    return json({ error: e?.message || "create_failed" }, 400);
  }
}
