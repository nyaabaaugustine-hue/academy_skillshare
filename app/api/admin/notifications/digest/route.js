import { NextResponse } from "next/server";

import { assertAdmin } from "@/lib/admin-auth";
import { buildAdminDigest } from "@/lib/admin-digest";
import { sendAdminDigestEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;
  const digest = await buildAdminDigest();
  return NextResponse.json({ ok: true, digest }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  const unauthorized = await assertAdmin();
  if (unauthorized) return unauthorized;

  const digest = await buildAdminDigest();
  const result = await sendAdminDigestEmail({ subject: digest.subject, html: digest.html, text: digest.text });
  return NextResponse.json({ ok: true, sent: result, digest: { subject: digest.subject, counts: digest.counts } }, { headers: { "Cache-Control": "no-store" } });
}
