import { NextResponse } from "next/server";
import { vapidPublicKey, pushConfigured } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ok: true, configured: pushConfigured(), publicKey: vapidPublicKey() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
