import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import {
  LeaderboardSetupError,
  listLeaderboard,
  saveLeaderboardEntry,
} from "@/lib/server/leaderboard";
import { clientKey, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The one ranking both clients use.
 *
 * GET  /api/leaderboard           top 50, public (it is a scoreboard)
 * POST /api/leaderboard           record a finished learner's totals
 *
 * A signed-in browser learner is identified by their account. The Android app
 * is identified by its device learner reference, which is stable per install
 * and per learner; the server clamps every value so a bad or hostile client can
 * never take more than 12 steps or 12×100 points.
 */

const REF_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? "50");
  try {
    const entries = await listLeaderboard(Number.isFinite(limit) ? limit : 50);
    return NextResponse.json(
      { entries, updatedAt: new Date().toISOString() },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not read the leaderboard.", error);
    return NextResponse.json(
      {
        error:
          error instanceof LeaderboardSetupError
            ? error.message
            : "The leaderboard is unavailable right now.",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  // The app path is unauthenticated (identified only by a device reference), so
  // throttle by client IP before doing any work. 60 saves per minute is
  // generous for a classroom sharing one NAT, and still stops a single abuser.
  const limit = rateLimit(`leaderboard:${clientKey(request)}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many saves. Try again in a moment." },
      {
        status: 429,
        headers: { "retry-after": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
  }

  // A browser session wins: it is the only identity the server can verify.
  let userId: string | null = null;
  let sessionName = "";
  try {
    const { data } = await auth.getSession();
    if (data?.user) {
      userId = data.user.id;
      sessionName = data.user.name ?? "";
    }
  } catch (error) {
    console.error("Could not verify the leaderboard session.", error);
  }

  const ref = typeof body.ref === "string" ? body.ref.trim() : "";
  if (!userId && !REF_PATTERN.test(ref)) {
    return NextResponse.json(
      {
        error:
          "Sign in, or send the app learner reference, to save a leaderboard entry.",
      },
      { status: 401 },
    );
  }

  const rawName =
    typeof body.name === "string" && body.name.trim().length >= 2
      ? body.name
      : sessionName;

  try {
    const { entry, rank } = await saveLeaderboardEntry({
      id: userId ? `web:${userId}` : `app:${ref}`,
      source: userId ? "web" : "app",
      name: rawName,
      stepsCompleted: body.stepsCompleted as number,
      practicesCompleted: body.practicesCompleted as number,
      scoreTotal: body.scoreTotal as number,
      avatar: typeof body.avatar === "string" ? body.avatar : null,
    });
    return NextResponse.json({ entry, rank }, { status: 200 });
  } catch (error) {
    console.error("Could not save the leaderboard entry.", error);
    return NextResponse.json(
      {
        error:
          error instanceof LeaderboardSetupError
            ? error.message
            : "Your score could not be saved.",
      },
      { status: 503 },
    );
  }
}
