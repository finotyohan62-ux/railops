const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const docsRoot = path.join(root, 'docs');
const worklogPath = path.join(docsRoot, 'worklog-railops.md');
const appendDir = path.join(docsRoot, 'worklog-railops-append');

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

assert.ok(fs.existsSync(worklogPath), 'docs/worklog-railops.md must exist');

const files = [worklogPath];
if (fs.existsSync(appendDir)) {
  for (const name of fs.readdirSync(appendDir).filter(name => name.endsWith('.md')).sort()) {
    files.push(path.join(appendDir, name));
  }
}

const findings = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of forbidden) {
    if (rule.pattern.test(text)) {
      findings.push(`${path.relative(root, file)}: ${rule.label}`);
    }
  }
}

assert.deepEqual(
  findings,
  [],
  `RailOps worklogs must remain secret-free:\n${findings.join('\n')}`
);

console.log(`v150b2b worklog privacy: OK (${files.length} files checked)`);
