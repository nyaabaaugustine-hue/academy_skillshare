import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

export const UPLOADS_BUCKET = "uploads";

let client: S3Client | undefined;

export function getStorageClient() {
  if (client) return client;

  const endpoint = process.env.AWS_ENDPOINT_URL_S3?.trim();
  const region = process.env.AWS_REGION?.trim();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Neon Object Storage is not configured. Set the AWS S3 endpoint, region, and credentials.",
    );
  }

  client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return client;
}
