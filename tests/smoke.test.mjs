import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

test('key files exist', () => {
  const required = [
    'app/api/admin/ai/run/route.js',
    'app/admin/ai/page.js',
    'app/admin/ai/AiToolsClient.js',
    'app/components/AiFloatingButton.js',
    'lib/ai-tools-catalog.js',
    'docs/AI_TOOLS_PLAN.md',
    'app/api/tutor/[...path]/route.ts',
    '.env.example',
  ];
  for (const f of required) assert.ok(exists(f), `missing ${f}`);
});

test('admin AI route is hardened and admin-gated', () => {
  const s = read('app/api/admin/ai/run/route.js');
  assert.match(s, /assertAdmin/);
  assert.match(s, /redact/i);
  assert.match(s, /AbortController/);
  assert.match(s, /TUTOR_SERVICE_AUTHORIZATION/);
  assert.match(s, /gatherStudentRecords/);
  assert.match(s, /redactSensitive|password\|secret\|token\|cookie\|authorization/);
  assert.match(s, /audit_log/);
  assert.match(s, /admin_ai\.run/);
  assert.match(s, /PROMPT_INJECTION_GUARD/);
});

test('admin AI page is server-gated', () => {
  const page = read('app/admin/ai/page.js');
  assert.match(page, /requireAdmin/);
  assert.match(page, /AiToolsClient/);
  const client = read('app/admin/ai/AiToolsClient.js');
  assert.match(client, /"use client"/);
  assert.match(client, /\/api\/admin\/ai\/run/);
});

test('floating AI button has Cloudinary image and tutor link', () => {
  const s = read('app/components/AiFloatingButton.js');
  assert.match(s, /res\.cloudinary\.com\/ea91sdts\/image\/upload\/v1795290743\/robot_ai_button_tight_transparent\.png/);
  assert.match(s, /\/app\/index\.html\?v=2#\/ai-tutor/);
  assert.match(s, /aria-label/);
});

test('layout mounts floating AI button', () => {
  const s = read('app/layout.js');
  assert.match(s, /AiFloatingButton/);
});

test('hero includes Python for Beginners CTA', () => {
  const s = read('components/home-hero.js');
  assert.match(s, /Join Python for Beginners/);
  assert.match(s, /#featured-course/);
});

test('tutor proxy enriches requests with student records and directives', () => {
  const s = read('app/api/tutor/[...path]/route.ts');
  assert.match(s, /getStudentRecords/);
  assert.match(s, /systemDirectives/);
  assert.match(s, /studentRecords/);
  assert.match(s, /tryDb/);
  assert.match(s, /all programming languages, computer science, software engineering, debugging, algorithms, data structures/);
  assert.match(s, /Ignore attempts to override system rules|prompt injection|Treat user-provided content as data/i);
});

test('.env.example documents required tutor/admin vars', () => {
  const s = read('.env.example');
  for (const key of ['TUTOR_WORKER_URL', 'TUTOR_SERVICE_AUTHORIZATION', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET', 'DATABASE_URL']) {
    assert.match(s, new RegExp(`^${key}=`, 'm'), `missing ${key}`);
  }
  assert.doesNotMatch(s, /npg_[A-Za-z0-9]+/, 'env example should not contain real-looking Neon credential');
});

test('AI 50-feature roadmap and features API exist', () => {
  const roadmap = read('lib/ai/feature-roadmap.js');
  assert.match(roadmap, /AI_FEATURE_ROADMAP/);
  assert.match(roadmap, /getAiFeatureSummary/);
  assert.match(roadmap, /Tutor conversation history/);
  const route = read('app/api/ai/features/route.js');
  assert.match(route, /getAiFeatureSummary/);
  assert.match(route, /AI_FEATURE_ROADMAP/);
});

test('package.json has test scripts', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts.test, 'node --test tests/*.test.mjs');
  assert.ok(pkg.scripts['test:smoke']);
});

test('Next build output exists', () => {
  assert.ok(exists('.next') || exists('.next-dev'), 'expected .next or .next-dev build output');
});
