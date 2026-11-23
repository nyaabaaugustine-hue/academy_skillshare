import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { data: session } = await auth.getSession();
    const user = session?.user;
    if (!user?.email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const result = await sendWelcomeEmail({ name: user.name, email: user.email });
    return NextResponse.json({ ok: true, email: result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "welcome_email_failed" }, { status: 200 });
  }
}
