import "server-only";

import { generatedAvatar } from "./avatar";
import { getDatabase } from "./database";

/**
 * Shared leaderboard storage.
 *
 * One row per learner, written by the Android app (through the public ingest
 * endpoint, keyed by its device learner reference) and by the website (keyed by
 * the signed-in account). Both clients read the same ordered list, which is why
 * a phone learner and a browser learner appear in one ranking.
 *
 * Score = sum of the per-step scores (0-100 each), so finishing more steps and
 * scoring higher both move a learner up. Ties fall back to steps completed,
 * then to whoever got there first.
 */

// Mirrors the course in sepnet_lms/lib/features/course/python_course_content.dart:
// 12 video lessons + 4 concept practices + 2 fix-the-bug practices.
export const MAX_STEPS = 18;
export const MAX_PRACTICES = 6;

const MAX_NAME = 40;
const MAX_AVATAR_BYTES = 60 * 1024;
const AVATAR_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export type LeaderboardEntry = {
  id: string;
  rank: number;
  name: string;
  hasAvatar: boolean;
  stepsCompleted: number;
  practicesCompleted: number;
  score: number;
  average: number;
  source: "web" | "app";
  updatedAt: string;
};

export type LeaderboardSubmission = {
  id: string;
  name: string;
  source: "web" | "app";
  stepsCompleted: number;
  practicesCompleted: number;
  scoreTotal: number;
  avatar?: string | null;
};

type Row = {
  id: string;
  display_name: string;
  steps_completed: number;
  practices_completed: number;
  score_total: number;
  source: string;
  updated_at: string | Date;
};

let tableReady: Promise<void> | undefined;

/**
 * Thrown when the database role is not allowed to create the table, which is
 * the case for the website's Neon role: the schema is owned by the project
 * owner. `db/001_leaderboard.sql` installs it; this error says so.
 */
export class LeaderboardSetupError extends Error {
  constructor() {
    super(
      "The leaderboard table or its permissions are not configured. Run website/db/001_leaderboard.sql as the database owner.",
    );
    this.name = "LeaderboardSetupError";
  }
}

const isPermissionError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  (("code" in error && (error as { code?: unknown }).code === "42501") ||
    (error instanceof Error &&
      error.message.toLowerCase().includes("permission denied")));

const isMissingTableError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === "42P01";

/** Checks table access without requiring runtime DDL privileges. */
async function ensureTable() {
  if (!tableReady) {
    tableReady = (async () => {
      const sql = getDatabase();
      await sql`SELECT 1 FROM public.leaderboard_entries LIMIT 0`;
    })().catch((error) => {
      // A failed access check must be retried on the next request, not cached.
      tableReady = undefined;
      throw isPermissionError(error) || isMissingTableError(error)
        ? new LeaderboardSetupError()
        : error;
    });
  }
  return tableReady;
}

const clampInt = (value: unknown, max: number) => {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(max, Math.round(number)));
};

function cleanName(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2) return "Learner";
  return name.slice(0, MAX_NAME);
}

function toEntry(row: Row, rank: number): LeaderboardEntry {
  const steps = Number(row.steps_completed) || 0;
  const score = Number(row.score_total) || 0;
  return {
    id: row.id,
    rank,
    name: row.display_name,
    // Every entry has a picture: the uploaded photo when there is one, otherwise
    // the deterministic default produced by generatedAvatar.
    hasAvatar: true,
    stepsCompleted: steps,
    practicesCompleted: Number(row.practices_completed) || 0,
    score,
    average: steps > 0 ? Math.round(score / steps) : 0,
    source: row.source === "app" ? "app" : "web",
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at),
  };
}

export async function listLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  await ensureTable();
  const sql = getDatabase();
  const capped = clampInt(limit, 100) || 50;
  const rows = (await sql`
    SELECT id, display_name,
           steps_completed, practices_completed, score_total, source, updated_at
    FROM leaderboard_entries
    ORDER BY score_total DESC, steps_completed DESC, updated_at ASC
    LIMIT ${capped}`) as unknown as Row[];

  return rows.map((row, index) => toEntry(row, index + 1));
}

export async function saveLeaderboardEntry(
  submission: LeaderboardSubmission,
): Promise<{ entry: LeaderboardEntry; rank: number }> {
  await ensureTable();
  const sql = getDatabase();

  const steps = clampInt(submission.stepsCompleted, MAX_STEPS);
  const practices = Math.min(
    clampInt(submission.practicesCompleted, MAX_PRACTICES),
    steps,
  );
  // A step is worth at most 100, so more points than that is not possible.
  const score = Math.min(clampInt(submission.scoreTotal, MAX_STEPS * 100), steps * 100);
  const name = cleanName(submission.name);
  const avatar = normaliseAvatar(submission.avatar ?? null);

  const rows = (await sql`
    INSERT INTO leaderboard_entries
      (id, display_name, avatar_data, steps_completed, practices_completed, score_total, source, updated_at)
    VALUES
      (${submission.id}, ${name}, ${avatar}, ${steps}, ${practices}, ${score}, ${submission.source}, now())
    ON CONFLICT (id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      avatar_data = COALESCE(EXCLUDED.avatar_data, leaderboard_entries.avatar_data),
      steps_completed = GREATEST(leaderboard_entries.steps_completed, EXCLUDED.steps_completed),
      practices_completed = GREATEST(leaderboard_entries.practices_completed, EXCLUDED.practices_completed),
      score_total = GREATEST(leaderboard_entries.score_total, EXCLUDED.score_total),
      updated_at = now()
    RETURNING id, display_name,
              steps_completed, practices_completed, score_total, source, updated_at`) as unknown as Row[];

  const entry = toEntry(rows[0], 1);
  const better = (await sql`
    SELECT count(*)::int AS ahead
    FROM leaderboard_entries
    WHERE score_total > ${entry.score}
       OR (score_total = ${entry.score} AND steps_completed > ${entry.stepsCompleted})`) as unknown as Array<{
    ahead: number;
  }>;

  const rank = (Number(better[0]?.ahead) || 0) + 1;
  return { entry: { ...entry, rank }, rank };
}

export async function getLeaderboardAvatar(
  id: string,
): Promise<{ contentType: string; bytes: Buffer }> {
  await ensureTable();
  const rows = (await getDatabase()`
    SELECT avatar_data FROM leaderboard_entries WHERE id = ${id}`) as unknown as Array<{
    avatar_data: string | null;
  }>;
  const raw = rows[0]?.avatar_data;
  const match = typeof raw === "string" ? AVATAR_PATTERN.exec(raw) : null;
  if (match) {
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.byteLength > 0 && bytes.byteLength <= MAX_AVATAR_BYTES) {
      return { contentType: match[1], bytes };
    }
  }

  // No uploaded photo (or a malformed one): serve the learner's generated
  // default so every row on the board still shows a picture.
  return generatedAvatar(id);
}

/**
 * Keeps uploaded photos small: one 256 px JPEG is plenty for a 44 px avatar row
 * and keeps the row (and the page) light. Anything malformed is dropped rather
 * than stored.
 */
function normaliseAvatar(value: string | null): string | null {
  if (typeof value !== "string" || !value.startsWith("data:")) return null;
  const match = AVATAR_PATTERN.exec(value);
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_AVATAR_BYTES) return null;
  return `data:${match[1]};base64,${match[2]}`;
}
