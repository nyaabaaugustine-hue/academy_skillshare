import "server-only";

import { getDatabase } from "./database";

const STEP_ID = /^[A-Za-z0-9_-]{1,80}$/;
const EVENT_ID = /^[A-Za-z0-9_-]{8,100}$/;
export const MAX_PROGRESS_BATCH = 100;

export type ProgressEventInput = {
  eventId: string;
  stepId: string;
  score: number;
};

export type ProgressRow = {
  step_id: string;
  best_score: number;
  attempts: number;
  completed_at: string | Date;
  updated_at: string | Date;
};

export function parseProgressEvents(value: unknown):
  | { events: ProgressEventInput[] }
  | { error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Send a JSON object." };
  }
  const candidate = (value as { events?: unknown }).events;
  if (!Array.isArray(candidate) || candidate.length === 0) {
    return { error: "Include at least one progress event." };
  }
  if (candidate.length > MAX_PROGRESS_BATCH) {
    return { error: `Send no more than ${MAX_PROGRESS_BATCH} events at once.` };
  }

  const events: ProgressEventInput[] = [];
  for (const item of candidate) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { error: "A progress event is invalid." };
    }
    const event = item as Record<string, unknown>;
    if (typeof event.eventId !== "string" || !EVENT_ID.test(event.eventId)) {
      return { error: "A progress event ID is invalid." };
    }
    if (typeof event.stepId !== "string" || !STEP_ID.test(event.stepId)) {
      return { error: "A course step ID is invalid." };
    }
    if (
      typeof event.score !== "number" ||
      !Number.isInteger(event.score) ||
      event.score < 0 ||
      event.score > 100
    ) {
      return { error: "A course score must be a whole number from 0 to 100." };
    }
    events.push({
      eventId: event.eventId,
      stepId: event.stepId,
      score: event.score,
    });
  }
  return { events };
}

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** Returns only the authenticated account's progress; never accepts user_id. */
export async function listCourseProgress(userId: string) {
  const sql = getDatabase();
  const rows = (await sql`
    SELECT step_id, best_score, attempts, completed_at, updated_at
    FROM public.course_progress
    WHERE user_id = ${userId}
    ORDER BY completed_at ASC, step_id ASC
  `) as unknown as ProgressRow[];
  return rows.map((row) => ({
    stepId: row.step_id,
    bestScore: Number(row.best_score),
    attempts: Number(row.attempts),
    completedAt: iso(row.completed_at),
    updatedAt: iso(row.updated_at),
  }));
}

/**
 * Persists a bounded, idempotent batch. Identity is supplied only by the
 * server-side auth verifier. Client timestamps are intentionally not trusted.
 */
/** Returns bounded, code-free event history for the authenticated account. */
export async function listCourseProgressEvents(userId: string) {
  const sql = getDatabase();
  const rows = (await sql`
    SELECT event_id, step_id, score, received_at
    FROM public.course_progress_events
    WHERE user_id = ${userId}
    ORDER BY received_at DESC
    LIMIT 500
  `) as unknown as Array<{
    event_id: string;
    step_id: string;
    score: number;
    received_at: string | Date;
  }>;
  return rows.reverse().map((row) => ({
    eventId: row.event_id,
    stepId: row.step_id,
    score: Number(row.score),
    receivedAt: iso(row.received_at),
  }));
}

export async function recordCourseProgress(
  userId: string,
  events: ProgressEventInput[],
): Promise<{ accepted: number }> {
  if (!events.length) return { accepted: 0 };
  const sql = getDatabase();
  const values: (string | number)[] = [];
  const tuples = events.map((event, index) => {
    const offset = index * 4;
    values.push(userId, event.eventId, event.stepId, event.score);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
  });

  const query = `
    WITH incoming(user_id, event_id, step_id, score) AS (
      VALUES ${tuples.join(", ")}
    ), inserted AS (
      INSERT INTO public.course_progress_events (user_id, event_id, step_id, score)
      SELECT user_id, event_id, step_id, score FROM incoming
      ON CONFLICT (user_id, event_id) DO NOTHING
      RETURNING user_id, step_id, score, received_at
    ), grouped AS (
      SELECT user_id, step_id, MAX(score)::smallint AS best_score,
             COUNT(*)::integer AS attempts, MAX(received_at) AS completed_at
      FROM inserted
      GROUP BY user_id, step_id
    ), saved AS (
      INSERT INTO public.course_progress
        (user_id, step_id, best_score, attempts, completed_at, updated_at)
      SELECT user_id, step_id, best_score, attempts, completed_at, now()
      FROM grouped
      ON CONFLICT (user_id, step_id) DO UPDATE SET
        best_score = GREATEST(course_progress.best_score, EXCLUDED.best_score),
        attempts = course_progress.attempts + EXCLUDED.attempts,
        completed_at = GREATEST(course_progress.completed_at, EXCLUDED.completed_at),
        updated_at = now()
      RETURNING user_id
    )
    SELECT (SELECT COUNT(*)::integer FROM inserted) AS accepted
  `;
  const result = (await sql.query(query, values)) as unknown as Array<{
    accepted: number;
  }>;
  return { accepted: Number(result[0]?.accepted) || 0 };
}
