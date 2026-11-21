import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_TOOLS, AI_TOOL_CATEGORIES, getAiTool } from '../lib/ai-tools-catalog.js';

test('catalog has 100 tools', () => {
  assert.equal(AI_TOOLS.length, 100);
});

test('tool numbers are 1..100 unique', () => {
  const nos = AI_TOOLS.map((t) => t.no).sort((a, b) => a - b);
  assert.deepEqual(nos, Array.from({ length: 100 }, (_, i) => i + 1));
});

test('tool ids are unique, kebab-case-ish strings', () => {
  const ids = new Set();
  for (const t of AI_TOOLS) {
    assert.equal(typeof t.id, 'string');
    assert.ok(t.id.length > 0, 'id empty');
    assert.match(t.id, /^[a-z0-9-]+$/);
    assert.ok(!ids.has(t.id), `duplicate id ${t.id}`);
    ids.add(t.id);
  }
});

test('every tool has required fields and valid status/category', () => {
  const statuses = new Set(['available', 'beta', 'planned']);
  const cats = new Set(AI_TOOL_CATEGORIES);
  for (const t of AI_TOOLS) {
    assert.equal(typeof t.name, 'string');
    assert.ok(t.name.length > 0);
    assert.equal(typeof t.description, 'string');
    assert.ok(t.description.length > 10);
    assert.ok(statuses.has(t.status), `bad status ${t.status} for ${t.id}`);
    assert.ok(cats.has(t.category), `bad category ${t.category} for ${t.id}`);
  }
});

test('categories list is non-empty and used', () => {
  assert.ok(AI_TOOL_CATEGORIES.length >= 10);
  const used = new Set(AI_TOOLS.map((t) => t.category));
  for (const c of AI_TOOL_CATEGORIES) assert.ok(used.has(c), `unused category ${c}`);
});

test('getAiTool returns tool or null', () => {
  assert.equal(getAiTool('nope'), null);
  assert.equal(getAiTool(''), null);
  assert.equal(getAiTool(undefined), null);
  const t = getAiTool('quiz-generator');
  assert.ok(t);
  assert.equal(t.no, 2);
  assert.equal(t.name, 'Quiz generator');
});

test('catalog has available and planned tools', () => {
  const available = AI_TOOLS.filter((t) => t.status === 'available').length;
  const planned = AI_TOOLS.filter((t) => t.status === 'planned').length;
  assert.ok(available >= 30, `expected >=30 available, got ${available}`);
  assert.ok(planned >= 50, `expected >=50 planned, got ${planned}`);
  assert.equal(available + planned + AI_TOOLS.filter((t) => t.status === 'beta').length, 100);
});

test('student-record related tools exist', () => {
  const ids = new Set(AI_TOOLS.map((t) => t.id));
  for (const id of ['learner-progress-summarizer', 'at-risk-learner-detector', 'cohort-analytics-reporter', 'parent-guardian-progress-report-generator']) {
    assert.ok(ids.has(id), `missing ${id}`);
  }
});
