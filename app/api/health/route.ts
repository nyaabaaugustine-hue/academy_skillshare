import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { getDatabase } from "@/lib/server/database";
import { getStorageClient, UPLOADS_BUCKET } from "@/lib/server/storage";

export const runtime = "nodejs";

export async function GET() {
  const services = {
    postgres: "ok",
    auth: "ok",
    storage: "ok",
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

  const storageConfigured = [
    process.env.AWS_ENDPOINT_URL_S3,
    process.env.AWS_REGION,
    process.env.AWS_ACCESS_KEY_ID,
    process.env.AWS_SECRET_ACCESS_KEY,
  ].every((value) => Boolean(value?.trim()));

  if (!storageConfigured) {
    services.storage = "not-configured";
  } else {
    try {
      await getStorageClient().send(
        new HeadBucketCommand({ Bucket: UPLOADS_BUCKET }),
      );
    } catch (error) {
      console.error("Neon Object Storage health check failed.", error);
      services.storage = "error";
    }
  }

  const appHealthy = services.postgres === "ok" && services.auth === "ok";
  const status = appHealthy
    ? services.storage === "ok" || services.storage === "not-configured"
      ? "ok"
      : "degraded"
    : "error";

  return NextResponse.json(
    { status, services },
    { status: status === "error" ? 503 : 200 },
  );
}
