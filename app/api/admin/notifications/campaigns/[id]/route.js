import { NextResponse } from "next/server";

import { assertAdmin } from "@/lib/admin-auth";
import { getCampaign, getCampaignAnalytics } from "@/lib/notification-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request, { params }) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const analytics = await getCampaignAnalytics(id);
  if (!analytics?.campaign) return json({ error: "not_found" }, 404);
  return json({ ok: true, ...analytics });
}
