import "server-only";

import { getDatabase } from "./database";

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
  readAt: string | null;
};

export type AnnouncementCursor = { createdAt: string; id: string } | null;

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function encodeCursor(row: { createdAt: string | Date; id: string }) {
  return Buffer.from(
    JSON.stringify({ createdAt: iso(row.createdAt), id: row.id }),
  ).toString("base64url");
}

export function decodeCursor(value: string | null): AnnouncementCursor {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (
      typeof parsed?.createdAt === "string" &&
      !Number.isNaN(Date.parse(parsed.createdAt)) &&
      typeof parsed?.id === "string"
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
  } catch {
    // An invalid cursor simply starts from the beginning.
  }
  return null;
}

export async function saveDeviceToken(
  userId: string,
  token: string,
  platform: string,
): Promise<void> {
  const sql = getDatabase();
  await sql`
    INSERT INTO public.fcm_tokens (user_id, token, platform, updated_at)
    VALUES (${userId}, ${token}, ${platform}, now())
    ON CONFLICT (user_id, token)
    DO UPDATE SET platform = EXCLUDED.platform, updated_at = now()
  `;
}

export async function deleteDeviceToken(userId: string, token: string): Promise<void> {
  const sql = getDatabase();
  await sql`
    DELETE FROM public.fcm_tokens WHERE user_id = ${userId} AND token = ${token}
  `;
}

export async function listDeviceTokens(): Promise<string[]> {
  const sql = getDatabase();
  const rows = (await sql`
    SELECT token FROM public.fcm_tokens
  `) as unknown as { token: string }[];
  return rows.map((row) => row.token);
}

export async function deleteDeviceTokens(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  const sql = getDatabase();
  await sql`
    DELETE FROM public.fcm_tokens WHERE token = ANY(${tokens}::text[])
  `;
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  audience: string;
  createdBy: string | null;
}): Promise<Announcement> {
  const sql = getDatabase();
  const rows = (await sql`
    INSERT INTO public.announcements (title, body, audience, created_by)
    VALUES (${input.title}, ${input.body}, ${input.audience}, ${input.createdBy})
    RETURNING
      id,
      title,
      body,
      audience,
      created_at as "createdAt",
      null::timestamptz as "readAt"
  `) as unknown as Announcement[];
  return { ...rows[0], createdAt: iso(rows[0].createdAt) };
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  const sql = getDatabase();
  const rows = (await sql`
    SELECT a.id, a.title, a.body, a.audience,
           a.created_at as "createdAt", null::timestamptz as "readAt"
    FROM public.announcements a
    WHERE a.id = ${id}::uuid AND a.audience = 'all'
    LIMIT 1
  `) as unknown as Announcement[];
  const row = rows[0];
  return row ? { ...row, createdAt: iso(row.createdAt) } : null;
}

export async function listAnnouncements(
  userId: string,
  limit: number,
  cursor: AnnouncementCursor,
): Promise<{ items: Announcement[]; nextCursor: string | null }> {
  const sql = getDatabase();
  const rows = (await sql`
    SELECT a.id, a.title, a.body, a.audience,
           a.created_at as "createdAt", r.read_at as "readAt"
    FROM public.announcements a
    LEFT JOIN public.announcement_reads r
      ON r.announcement_id = a.id AND r.user_id = ${userId}
    WHERE a.audience = 'all'
    ${
      cursor
        ? sql`(a.created_at, a.id) < (${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)`
        : sql``
    }
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT ${limit + 1}
  `) as unknown as Array<{
    id: string;
    title: string;
    body: string;
    audience: string;
    createdAt: string | Date;
    readAt: string | Date | null;
  }>;

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    audience: row.audience,
    createdAt: iso(row.createdAt),
    readAt: row.readAt === null ? null : iso(row.readAt),
  }));
  const last = items.at(-1);
  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(last) : null,
  };
}

export async function markAnnouncementRead(id: string, userId: string): Promise<boolean> {
  const sql = getDatabase();
  const rows = (await sql`
    INSERT INTO public.announcement_reads (announcement_id, user_id, read_at)
    SELECT a.id, ${userId}, now()
    FROM public.announcements a
    WHERE a.id = ${id}::uuid AND a.audience = 'all'
    ON CONFLICT (announcement_id, user_id) DO NOTHING
    RETURNING id
  `) as unknown as { id: string }[];
  return rows.length > 0;
}

export async function listRecentAnnouncements(limit: number): Promise<Announcement[]> {
  const sql = getDatabase();
  const rows = (await sql`
    SELECT id, title, body, audience, created_at as "createdAt",
           null::timestamptz as "readAt"
    FROM public.announcements
    ORDER BY created_at DESC, id DESC
    LIMIT ${limit}
  `) as unknown as Announcement[];
  return rows.map((row) => ({ ...row, createdAt: iso(row.createdAt) }));
}
