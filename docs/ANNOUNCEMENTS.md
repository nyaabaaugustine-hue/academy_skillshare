# Announcements and push delivery

Admins publish one-way announcements from `/admin/announcements`. Every signed-in
learner sees them in the Flutter app inbox. Firebase Cloud Messaging (FCM) is an
optional delivery channel: the inbox is the source of truth, so a missing or
misconfigured service account never loses a message.

## Database

Apply `db/014_announcements.sql` once as the Neon database owner after
`013_fcm_campaigns.sql`.

- `public.announcements` — published messages.
- `public.fcm_tokens` — one row per `(user_id, token)`; `user_id` is always
  derived from the Neon Auth session on the server.
- `public.announcement_reads` — per-user read state.

Runtime connections use the least-privilege `skillsbridge_website` role, which
gets DML only. Flutter never talks to Neon directly.

## Configuration

Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full service-account JSON string for
Firebase project `skillbridge-academy-e5e4c`. In Google Cloud this is
**Firebase project settings → Service accounts → Generate new private key**.

`GOOGLE_APPLICATION_CREDENTIALS` is also supported for local development or
platforms with Workload Identity. When neither is set, the admin page shows
"Push delivery is not configured" and the publish endpoint returns
`pushEnabled: false` with `sent: 0`.

Treat the service-account JSON as a secret. It is not needed by the Flutter app.

## API contract

All Flutter routes use the same origin allowlist and cookie-backed Neon Auth
session as `/api/progress`. `user.id` is never accepted from a request body.

| Method | Path | Body / query | Response |
| --- | --- | --- | --- |
| `POST` | `/api/device-tokens` | `{token, platform}` where platform is `android`, `ios`, or `web` | `{ok: true}` |
| `DELETE` | `/api/device-tokens` | `{token}` | `{ok: true}` |
| `GET` | `/api/announcements` | `limit` (1–100, default 20), `cursor` (opaque) | `{items: Announcement[], nextCursor}` |
| `POST` | `/api/announcements/:id/read` | — | `{ok: true}` |
| `POST` | `/api/admin/announcements` | `{title, body, audience?}` | `{id, sent, pushEnabled}` |
| `GET` | `/api/admin/announcements` | — | `{items, pushEnabled}` |

`Announcement` is
`{id, title, body, audience, createdAt, readAt}`; timestamps are ISO-8601.
Errors use `{error: "code"}` with 400/401/403/404/503 status codes.

## Push payload

The server sends a data-only FCM message:

```json
{
  "type": "announcement",
  "announcementId": "<uuid>",
  "title": "Title",
  "body": "Message"
}
```

The Flutter app uses `announcementId` to open the matching inbox item. Invalid
and unregistered tokens reported by FCM are pruned from `fcm_tokens`.

## Delivery behaviour

- Publishing always stores the announcement first, then fans out to all tokens
  in batches of 500 using `sendEachForMulticast`.
- Delivery is best-effort: FCM does not guarantee ordering or a receipt in the
  app. The inbox and `announcement_reads` are authoritative.
- Audience filtering currently accepts only `all` in learner queries. A future
  cohort/role audience needs a matching server-side predicate and migration.
