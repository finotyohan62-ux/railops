const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'v150b2b-test.html'), 'utf8');
const adapters = [
  'v150b2b-harness-core.js',
  'v150b2b-loader.js',
  'v150b2b-chef-chantier-stats.js',
  'v150b2b-owner-mode.js',
  'v150b2b-secure-admin.js',
  'v150b2b-secure-delete.js',
  'v150b2b-maintenance.js',
];

const buildTags = [...html.matchAll(/\?build=([a-z0-9]+)/gi)].map(match => match[1]);
assert.ok(buildTags.length >= adapters.length, 'preview must cache-bust every adapter');
assert.equal(new Set(buildTags).size, 1, 'all preview adapters must use the same build tag');

for (const file of adapters) {
  const occurrences = html.split(file).length - 1;
  assert.equal(occurrences, 1, `${file} must be injected exactly once`);
}

const order = adapters.slice(1).map(file => html.indexOf(file));
for (let i = 1; i < order.length; i += 1) {
  assert.ok(order[i - 1] < order[i], `${adapters[i]} must load before ${adapters[i + 1]}`);
}

assert.match(html, /fetch\('\.\/index\.html',\{cache:'no-store'\}\)/, 'preview must always fetch a fresh stable index');
assert.match(html, /document\.open\(\);document\.write\(html\);document\.close\(\);/, 'preview must render only after legacy neutralization and adapter injection');
assert.equal(html.includes('supabase/migrations/'), false, 'preview must never reference migrations directly');

console.log(`PASS: v150B-2B preview contract (${buildTags[0]})`);
