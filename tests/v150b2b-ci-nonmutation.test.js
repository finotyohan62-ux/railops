const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

function normalizedCommands(source) {
  return String(source)
    .split(/\r?\n/)
    .map(line => line.trim().toLowerCase())
    .filter(Boolean);
}

const lines = normalizedCommands(workflow);

assert.match(
  workflow,
  /permissions:\s*\n\s*contents:\s*read\b/,
  'verification workflow must keep repository contents read-only'
);
assert.match(
  workflow,
  /persist-credentials:\s*false\b/,
  'checkout must not persist write-capable GitHub credentials'
);

for (const forbidden of [
  /^git\s+push\b/,
  /^git\s+merge\b/,
  /^git\s+rebase\b/,
  /^git\s+reset\s+--hard\b/,
  /^gh\s+pr\s+merge\b/,
  /^vercel\s+(deploy\b|--prod\b)/,
  /^npx\s+vercel\s+(deploy\b|--prod\b)/,
]) {
  assert.equal(
    lines.some(line => forbidden.test(line)),
    false,
    `verification workflow must not contain mutating command matching ${forbidden}`
  );
}

assert.equal(
  workflow.includes('20260821_v150b2b_strict_rls.sql'),
  false,
  'verification workflow must never reference the strict RLS migration'
);
assert.equal(
  /supabase\s+(db\s+(push|reset)|migration\s+(up|repair)|functions\s+deploy|link\b)/i.test(workflow),
  false,
  'verification workflow must not deploy, reset, repair, link, or apply Supabase changes'
);

console.log('PASS: v150B-2B CI remains read-only, non-mutating, and non-deploying');
