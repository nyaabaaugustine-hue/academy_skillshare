import { NextResponse } from "next/server";

import { assertAdmin } from "@/lib/admin-auth";
import { processCampaign } from "@/lib/notification-campaigns";

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
    const result = await processCampaign(id, "admin");
    return json({ ok: true, result });
  } catch (e) {
    return json({ error: e?.message || "send_failed" }, 400);
  }
}
