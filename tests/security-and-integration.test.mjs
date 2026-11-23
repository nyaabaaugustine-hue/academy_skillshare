import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

test('tutor proxy allows only exact tutor targets', () => {
  const s = read('app/api/tutor/[...path]/route.ts');
  assert.match(s, /ALLOWED_TARGETS/);
  for (const t of ['v1/tutor/chat', 'v1/tutor/chat/stream', 'v1/tutor/vision', 'v1/tutor/resources']) {
    assert.ok(s.includes(`"${t}"`), `missing allowed target ${t}`);
  }
  assert.match(s, /not_found/);
});

test('tutor proxy has origin/CORS and payload limits', () => {
  const s = read('app/api/tutor/[...path]/route.ts');
  assert.match(s, /origin_not_allowed/);
  assert.match(s, /MAX_BODY_BYTES/);
  assert.match(s, /payload_too_large/);
  assert.match(s, /Access-Control-Allow-Origin/);
  assert.match(s, /cache-control/i);
});

test('tutor proxy redacts sensitive fields before attaching records', () => {
  const s = read('app/api/tutor/[...path]/route.ts');
  assert.match(s, /redactRecord/);
  assert.match(s, /password\|secret\|token\|cookie\|authorization/i);
  assert.match(s, /getStudentRecords/);
  assert.match(s, /decodeJwtSub/);
});

test('tutor proxy only enriches chat/stream/vision JSON bodies', () => {
  const s = read('app/api/tutor/[...path]/route.ts');
  assert.match(s, /v1\/tutor\/chat/);
  assert.match(s, /v1\/tutor\/vision/);
  assert.match(s, /application\/json/);
});

test('admin AI route limits request size and times out upstream', () => {
  const s = read('app/api/admin/ai/run/route.js');
  assert.match(s, /MAX_BODY_BYTES|payload_too_large|too_large|413/);
  assert.match(s, /AbortController/);
  assert.match(s, /timeout|TIMEOUT_MS|UPSTREAM_TIMEOUT/i);
});

test('admin AI route does not expose raw secrets in student context', () => {
  const s = read('app/api/admin/ai/run/route.js');
  assert.match(s, /redact/i);
  assert.match(s, /redactSensitive/);
});

test('compiled Flutter app includes AI tutor icon URL', () => {
  const s = read('public/app/main.dart.js');
  assert.match(s, /robot_ai_button_tight_transparent\.png/);
});

test('AI floating button component is client-side and accessible', () => {
  const s = read('app/components/AiFloatingButton.js');
  assert.match(s, /"use client"/);
  assert.match(s, /aria-label="[^"]*AI tutor[^"]*"/i);
  assert.match(s, /href=\{HREF\}|\/app\/index\.html\?v=2#\/ai-tutor/);
});

test('no obvious secret values committed in env example', () => {
  const s = read('.env.example');
  assert.doesNotMatch(s, /AIza[0-9A-Za-z_-]{20,}/);
  assert.doesNotMatch(s, /npg_[A-Za-z0-9]+/);
  assert.doesNotMatch(s, /sk-[A-Za-z0-9]{20,}/);
});

test('AI tools plan and catalog exist and are referenced by admin UI', () => {
  assert.ok(exists('docs/AI_TOOLS_PLAN.md'));
  const ui = read('app/admin/ai/AiToolsClient.js');
  assert.match(ui, /AI_TOOLS|tool|catalog/i);
});
