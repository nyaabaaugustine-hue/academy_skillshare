import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

test('cloudflare modules and admin page exist', () => {
  for (const f of [
    'lib/cloudflare/config.js',
    'lib/cloudflare/turnstile.js',
    'lib/cloudflare/usage.js',
    'components/turnstile-widget.js',
    'app/admin/cloudflare/page.js',
    'docs/CLOUDFLARE_FREE_TIER.md',
  ]) {
    assert.ok(exists(f), `missing ${f}`);
  }
});

test('.env.example documents cloudflare free-tier vars', () => {
  const s = read('.env.example');
  for (const key of [
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET',
    'CLOUDFLARE_R2_ENDPOINT',
    'CLOUDFLARE_TURNSTILE_SITE_KEY',
    'CLOUDFLARE_TURNSTILE_SECRET_KEY',
    'CLOUDFLARE_AI_GATEWAY_ID',
    'CLOUDFLARE_WEB_ANALYTICS_TOKEN',
  ]) {
    assert.match(s, new RegExp(`^${key}=`, 'm'), `missing ${key}`);
  }
});

test('turnstile verification is server-side, optional when unconfigured, and validates action/hostname', async () => {
  const { verifyTurnstile } = await import('../lib/cloudflare/turnstile.js');
  const prevSecret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  const prevHosts = process.env.TURNSTILE_HOSTNAMES;
  delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  delete process.env.TURNSTILE_HOSTNAMES;
  const skipped = await verifyTurnstile(new Request('https://example.com'), '');
  assert.equal(skipped.ok, true);
  assert.equal(skipped.skipped, true);

  process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY = 'test-secret';
  process.env.TURNSTILE_HOSTNAMES = 'example.com';
  const missing = await verifyTurnstile(new Request('https://example.com'), '');
  assert.equal(missing.ok, false);
  assert.equal(missing.error, 'turnstile_missing');

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ success: true, action: 'contact', hostname: 'example.com' }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const ok = await verifyTurnstile(new Request('https://example.com'), 'token', { action: 'contact' });
    assert.equal(ok.ok, true);
    const badAction = await verifyTurnstile(new Request('https://example.com'), 'token', { action: 'wrong' });
    assert.equal(badAction.ok, false);
    assert.equal(badAction.error, 'turnstile_action_mismatch');
  } finally {
    globalThis.fetch = originalFetch;
  }

  globalThis.fetch = async () => new Response(JSON.stringify({ success: true, action: 'contact', hostname: 'evil.example' }), { status: 200, headers: { 'content-type': 'application/json' } });
  try {
    const badHost = await verifyTurnstile(new Request('https://example.com'), 'token', { action: 'contact' });
    assert.equal(badHost.ok, false);
    assert.equal(badHost.error, 'turnstile_hostname_mismatch');
  } finally {
    globalThis.fetch = originalFetch;
  }

  if (prevSecret === undefined) delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  else process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY = prevSecret;
  if (prevHosts === undefined) delete process.env.TURNSTILE_HOSTNAMES;
  else process.env.TURNSTILE_HOSTNAMES = prevHosts;
});

test('public forms and admin auth verify turnstile server-side with action', () => {
  for (const f of [
    'app/api/contact/route.js',
    'app/api/enquiries/route.js',
    'app/api/enroll/route.js',
    'app/api/project-submissions/route.js',
    'app/api/reports/route.js',
    'app/api/admin/login/route.js',
    'app/api/admin/forgot-password/route.js',
  ]) {
    const s = read(f);
    assert.match(s, /verifyTurnstile/, `${f} missing verifyTurnstile`);
    assert.match(s, /action:\s*["'][^"']+["']/, `${f} missing expected action`);
  }
});

test('turnstile widget is client-side and only renders with a site key', () => {
  const s = read('components/turnstile-widget.js');
  assert.match(s, /"use client"/);
  assert.match(s, /siteKey/);
  assert.match(s, /challenges\.cloudflare\.com\/turnstile/);
  assert.match(s, /cf-turnstile-response|data-sitekey/);
});

test('web analytics is env-gated', () => {
  const s = read('app/layout.js');
  assert.match(s, /analyticsToken/);
  assert.match(s, /cloudflareinsights\.com/);
  assert.match(s, /data-cf-beacon/);
});

test('admin cloudflare page is gated and uses usage guard', () => {
  const s = read('app/admin/cloudflare/page.js');
  assert.match(s, /requireAdmin/);
  assert.match(s, /cloudflareServiceStatus/);
  assert.match(s, /getCloudflareUsage/);
  assert.doesNotMatch(s, /CLOUDFLARE_API_TOKEN/);
});

test('usage guard degrades when unconfigured and never enables billing', async () => {
  const { getCloudflareUsage } = await import('../lib/cloudflare/usage.js');
  const usage = await getCloudflareUsage();
  assert.equal(usage.ok, false);
  assert.equal(usage.reason, 'not_configured');
  const s = read('lib/cloudflare/usage.js');
  assert.match(s, /never enables billing/i);
  assert.doesNotMatch(s, /api\.cloudflare\.com\/[^\s"']*billing/i);
});
