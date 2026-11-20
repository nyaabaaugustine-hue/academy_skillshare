import "server-only";

import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | undefined;

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "Neon is not configured. Add DATABASE_URL to website/.env.local.",
    );
  }

  if (!sql) sql = neon(connectionString);
  return sql;
}
