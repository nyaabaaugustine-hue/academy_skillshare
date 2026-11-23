import { NextResponse } from "next/server";

import { assertAdmin } from "@/lib/admin-auth";
import { cancelCampaign } from "@/lib/notification-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request, { params }) {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  try {
    const result = await cancelCampaign(id);
    return json({ ok: true, result });
  } catch (e) {
    return json({ error: e?.message || "cancel_failed" }, 400);
  }
}
