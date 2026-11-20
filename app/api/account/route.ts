import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data: session, error } = await auth.getSession();
    if (error) throw error;

    return NextResponse.json(
      { user: session?.user ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not check the account session.", error);
    return NextResponse.json(
      { error: "Could not check your account. Please try again." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
