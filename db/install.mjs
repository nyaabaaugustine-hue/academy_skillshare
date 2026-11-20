import { readFile } from "node:fs/promises";

import { neon } from "@neondatabase/serverless";

/**
 * Installs the website's Neon schema migrations in order.
 *
 * The website's normal `DATABASE_URL` role deliberately cannot create tables, so
 * this script accepts an owner connection string instead:
 *
 *   NEON_OWNER_DATABASE_URL=postgresql://owner:...@.../neondb?sslmode=require \
 *     npm run db:install
 *
 * (Or paste each file under `db/*.sql` into the Neon SQL editor in order.)
 */
async function main() {
  const owner = process.env.NEON_OWNER_DATABASE_URL?.trim();
  const connectionString = owner || process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    console.error(
      "Set NEON_OWNER_DATABASE_URL (owner role) in website/.env.local, then run again.",
    );
    process.exitCode = 1;
    return;
  }

  const sql = neon(connectionString);
  let failed = false;

  for (const filename of ["001_leaderboard.sql", "002_shared_progress.sql"]) {
    const source = await readFile(new URL(`./${filename}`, import.meta.url), "utf8");
    // Strip full-line comments, then run one statement at a time: the Neon
    // driver runs a single statement per call.
    const statements = source
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      const label = statement.replace(/\s+/g, " ").slice(0, 70);
      try {
        await sql.query(statement);
        console.log(`ok   ${filename}: ${label}`);
      } catch (error) {
        failed = true;
        console.log(`FAIL ${filename}: ${label}`);
        console.log(`     ${error.code ?? ""} ${error.message}`);
      }
    }
  }

  if (!failed) {
    console.log("\nWebsite Neon schema migrations installed.");
    return;
  }

  process.exitCode = 1;
  if (!owner) {
    console.error(
      "\nThe current DATABASE_URL role cannot create tables. Add an owner\n" +
        "connection string as NEON_OWNER_DATABASE_URL (Neon Console -> Connect),\n" +
        "or run the ordered SQL migration files in the Neon SQL editor.",
    );
  }
}

await main();
