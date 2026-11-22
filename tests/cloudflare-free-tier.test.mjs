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

test('turnstile verification is server-side and optional when unconfigured', async () => {
  const { verifyTurnstile } = await import('../lib/cloudflare/turnstile.js');
  const previous = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  const skipped = await verifyTurnstile(new Request('https://example.com'), '');
  assert.equal(skipped.ok, true);
  assert.equal(skipped.skipped, true);

  process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY = 'test-secret';
  const missing = await verifyTurnstile(new Request('https://example.com'), '');
  assert.equal(missing.ok, false);
  assert.equal(missing.error, 'turnstile_missing');

  if (previous === undefined) delete process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  else process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY = previous;
});

test('public forms and admin login verify turnstile server-side', () => {
  for (const f of ['app/api/contact/route.js', 'app/api/enquiries/route.js', 'app/api/admin/login/route.js']) {
    const s = read(f);
    assert.match(s, /verifyTurnstile/, `${f} missing verifyTurnstile`);
    assert.match(s, /cf-turnstile-response/, `${f} missing token field`);
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
