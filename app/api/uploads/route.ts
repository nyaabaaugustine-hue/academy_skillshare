import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { rateLimit } from "@/lib/server/rate-limit";
import { getStorageClient, UPLOADS_BUCKET } from "@/lib/server/storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

async function requireUser() {
  const { data: session, error } = await auth.getSession();
  if (error) {
    console.error("Could not verify the upload session.", error);
    return { response: NextResponse.json({ error: "Could not verify your session." }, { status: 503 }) };
  }
  if (!session?.user) {
    return { response: NextResponse.json({ error: "Sign in to access uploads." }, { status: 401 }) };
  }
  return { user: session.user };
}

export async function POST(request: Request) {
  const result = await requireUser();
  if (result.response) return result.response;

  // Throttle per signed-in user: uploads are the heaviest write this site does
  // (up to 10 MB each), so cap bursts well below any human pace.
  const limit = rateLimit(`uploads:${result.user.id}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again in a moment." },
      {
        status: 429,
        headers: { "retry-after": String(limit.retryAfterSeconds) },
      },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Could not read the upload form.", error);
    return NextResponse.json({ error: "Send a valid multipart upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }
  if (file.size < 1 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Files must be between 1 byte and 10 MB." },
      { status: 413 },
    );
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Only PDF, JPEG, PNG, and WebP files are supported." },
      { status: 415 },
    );
  }

  const key = `users/${encodeURIComponent(result.user.id)}/${crypto.randomUUID()}${extension}`;
  try {
    await getStorageClient().send(
      new PutObjectCommand({
        Bucket: UPLOADS_BUCKET,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentLength: file.size,
        ContentType: file.type,
      }),
    );
  } catch (error) {
    console.error("Neon Object Storage upload failed.", error);
    return NextResponse.json({ error: "The file could not be uploaded." }, { status: 502 });
  }

  return NextResponse.json({ key }, { status: 201 });
}

export async function GET(request: Request) {
  const result = await requireUser();
  if (result.response) return result.response;

  const key = new URL(request.url).searchParams.get("key");
  const userPrefix = `users/${encodeURIComponent(result.user.id)}/`;
  if (!key || !key.startsWith(userPrefix)) {
    return NextResponse.json({ error: "Upload not found." }, { status: 404 });
  }

  try {
    const url = await getSignedUrl(
      getStorageClient(),
      new GetObjectCommand({ Bucket: UPLOADS_BUCKET, Key: key }),
      { expiresIn: 300 },
    );
    return NextResponse.json({ url, expiresIn: 300 });
  } catch (error) {
    console.error("Neon Object Storage download URL generation failed.", error);
    return NextResponse.json({ error: "The file could not be opened." }, { status: 502 });
  }
}
