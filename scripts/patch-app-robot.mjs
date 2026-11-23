#!/usr/bin/env node
/**
 * Patch the compiled Flutter web bundle without corrupting its encoding.
 *
 * PowerShell's Set-Content -Encoding UTF8 on Windows PowerShell 5.1 rewrites
 * the whole file (BOM + line endings) and can mangle non-ASCII bytes, which
 * leaves main.dart.js unparsable and the app page blank. This script edits the
 * file as UTF-8 text and verifies the result parses before exiting.
 *
 * Usage: node scripts/patch-app-robot.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const path = "public/app/main.dart.js";
const source = readFileSync(path, "utf8");
const before = (source.match(/"AI Tutor"/g) || []).length;

const patched = source.split('"AI Tutor"').join('"App Robot"');
if (patched === source) {
  console.log("No \"AI Tutor\" label found; bundle already patched.");
} else {
  writeFileSync(path, patched, "utf8");
}

const after = readFileSync(path, "utf8");
console.log(`Replaced ${before} label(s). "App Robot" count: ${(after.match(/"App Robot"/g) || []).length}`);
console.log(
  after.includes("robot_ai_button_tight_transparent.png")
    ? "Robot icon reference intact."
    : "WARNING: robot icon reference missing.",
);

try {
  execFileSync(process.execPath, ["--check", path], { stdio: "pipe" });
  console.log("Syntax check passed.");
} catch (error) {
  console.error("Syntax check FAILED:", String(error.stderr || error.message).slice(0, 2000));
  process.exitCode = 1;
}
