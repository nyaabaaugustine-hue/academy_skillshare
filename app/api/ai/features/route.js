import { NextResponse } from "next/server";
import { AI_FEATURE_ROADMAP, getAiFeatureSummary } from "../../../../lib/ai/feature-roadmap.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    summary: getAiFeatureSummary(),
    features: AI_FEATURE_ROADMAP,
  }, { headers: { "Cache-Control": "no-store" } });
}
