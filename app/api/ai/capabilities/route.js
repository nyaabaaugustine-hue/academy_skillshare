import { NextResponse } from "next/server";
import { AI_TUTOR_CAPABILITIES, AI_TUTOR_CAPABILITY_CATEGORIES, AI_TUTOR_MODES } from "../../../../lib/ai-tutor-capabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    total: AI_TUTOR_CAPABILITIES.length,
    categories: AI_TUTOR_CAPABILITY_CATEGORIES,
    modes: AI_TUTOR_MODES,
    capabilities: AI_TUTOR_CAPABILITIES,
  }, { headers: { "Cache-Control": "no-store" } });
}
