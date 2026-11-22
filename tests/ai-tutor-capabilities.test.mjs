import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('AI tutor capabilities catalog has 200 items and 10 categories', async () => {
  const mod = await import('../lib/ai-tutor-capabilities.js');
  assert.equal(mod.AI_TUTOR_CAPABILITIES.length, 200);
  assert.equal(mod.AI_TUTOR_CAPABILITY_CATEGORIES.length, 10);
  const ids = new Set(mod.AI_TUTOR_CAPABILITIES.map((c) => c.id));
  assert.equal(ids.size, 200);
});

test('AI tutor capabilities have required fields', async () => {
  const mod = await import('../lib/ai-tutor-capabilities.js');
  for (const c of mod.AI_TUTOR_CAPABILITIES) {
    assert.equal(typeof c.id, 'number');
    assert.equal(typeof c.category, 'string');
    assert.equal(typeof c.name, 'string');
    assert.equal(typeof c.description, 'string');
    assert.ok(c.name.length > 0);
    assert.ok(c.description.length > 0);
    assert.ok(mod.AI_TUTOR_CAPABILITY_CATEGORIES.includes(c.category));
  }
});

test('AI tutor modes and directive helper exist', async () => {
  const mod = await import('../lib/ai-tutor-capabilities.js');
  assert.ok(mod.AI_TUTOR_MODES.explain);
  assert.ok(mod.AI_TUTOR_MODES.debug);
  assert.ok(mod.AI_TUTOR_MODES.quiz);
  assert.equal(typeof mod.getTutorModeDirective('quiz'), 'string');
  assert.equal(mod.getTutorModeDirective('unknown-mode'), null);
});

test('capabilities API route exists and returns catalog', () => {
  const s = read('app/api/ai/capabilities/route.js');
  assert.match(s, /AI_TUTOR_CAPABILITIES/);
  assert.match(s, /Cache-Control/);
  assert.match(s, /no-store/);
});

test('tutor proxy supports mode directives', () => {
  const s = read('app/api/tutor/[...path]/route.ts');
  assert.match(s, /TUTOR_MODE_DIRECTIVES/);
  assert.match(s, /parsed\.mode \|\| parsed\.tutorMode/);
  assert.match(s, /Mode: Quiz/);
});
