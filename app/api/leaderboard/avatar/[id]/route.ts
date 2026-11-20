import { NextResponse } from "next/server";

import { getLeaderboardAvatar } from "@/lib/server/leaderboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the small profile photo stored with a leaderboard entry.
 *
 * Photos are deliberately outside the private uploads bucket: a ranking has to
 * show the same avatar to everybody, so this route exposes only the bytes that
 * were already sent as a public leaderboard image. A learner who never uploaded
 * a photo gets a generated default instead, so every row has a picture.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  if (!decodedId || decodedId.length > 120) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const avatar = await getLeaderboardAvatar(decodedId);
    return new NextResponse(new Uint8Array(avatar.bytes), {
      status: 200,
      headers: {
        "content-type": avatar.contentType,
        "content-length": String(avatar.bytes.byteLength),
        "cache-control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Could not read a leaderboard avatar.", error);
    return NextResponse.json({ error: "Not found." }, { status: 503 });
  }
}
