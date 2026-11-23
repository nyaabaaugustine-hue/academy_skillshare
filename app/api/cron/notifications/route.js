import { NextResponse } from "next/server";

import { processScheduledCampaigns } from "@/lib/notification-campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const result = await processScheduledCampaigns();
  return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}
