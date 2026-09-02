const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const snapshotsDir = path.join(root, 'docs', 'supabase-state');

const forbidden = [
  {
    label: 'JWT-like token',
    pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
    sample: 'eyJaaaaaaaaaaaaaaaaaaaa.bbbbbbbbbb.cccccccccc',
  },
  {
    label: 'Supabase secret key',
    pattern: /\bsb_secret_[A-Za-z0-9_-]{12,}\b/i,
    sample: 'sb_secret_abcdefghijklmnop',
  },
  {
    label: 'service role key assignment',
    pattern: /\b(?:SUPABASE_SERVICE_ROLE_KEY|service_role_key)\s*[:=]\s*["']?[A-Za-z0-9._-]{12,}/i,
    sample: 'SUPABASE_SERVICE_ROLE_KEY=abcdefghijklmnop',
  },
  {
    label: 'Authorization bearer token',
    pattern: /\bAuthorization\s*:\s*Bearer\s+[A-Za-z0-9._~-]{12,}/i,
    sample: 'Authorization: Bearer abcdefghijklmnop',
  },
];

for (const rule of forbidden) {
  assert.match(rule.sample, rule.pattern, `${rule.label} guard must detect its representative sample`);
}

const snapshotFiles = fs.readdirSync(snapshotsDir)
  .filter(name => /^\d{4}-\d{2}-\d{2}-\d{4}\.md$/.test(name))
  .sort();

assert.ok(snapshotFiles.length > 0, 'at least one Supabase state snapshot must exist');

const findings = [];
for (const name of snapshotFiles) {
  const text = fs.readFileSync(path.join(snapshotsDir, name), 'utf8');
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) findings.push(`${name}: ${rule.label}`);
  }
}

assert.deepEqual(
  findings,
  [],
  `diagnostic snapshots must remain metadata-only and secret-free:\n${findings.join('\n')}`
);

console.log(`v150b2b snapshot privacy: OK (${snapshotFiles.length} snapshots checked)`);
