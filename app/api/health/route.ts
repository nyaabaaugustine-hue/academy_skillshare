import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { getDatabase } from "@/lib/server/database";

export const runtime = "nodejs";

export async function GET() {
  const services = {
    postgres: "ok",
    auth: "ok",
  };

  try {
    await getDatabase()`SELECT 1`;
  } catch (error) {
    console.error("Neon Postgres health check failed.", error);
    services.postgres = "error";
  }

  try {
    const { error } = await auth.getSession();
    if (error) throw error;
  } catch (error) {
    console.error("Neon Auth health check failed.", error);
    services.auth = "error";
  }

  const healthy = services.postgres === "ok" && services.auth === "ok";

  return NextResponse.json(
    { status: healthy ? "ok" : "error", services },
    { status: healthy ? 200 : 503 },
  );
}
