const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const guide = fs.readFileSync(path.join(root, 'docs', 'v150b2b-verification-guide.md'), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'v150b2b-checks.yml'), 'utf8');

assert.match(
  guide,
  /node tests\/run-v150b2b-checks\.js/,
  'verification guide must keep the canonical local verification command'
);
assert.match(
  guide,
  /security\/v150b2b-rls-ready/,
  'verification guide must name the protected working branch'
);
assert.match(
  guide,
  /smoke-tests humains Admin \/ Chef \/ Agent \/ CTE \/ Chef de chantier/i,
  'verification guide must retain the human smoke-test gate before strict RLS'
);
assert.match(
  workflow,
  /- security\/v150b2b-rls-ready/,
  'CI must continue to run on pushes to the security branch'
);
assert.match(
  workflow,
  /pull_request:[\s\S]*?- main/,
  'CI must continue to run for pull requests targeting main'
);
assert.match(
  workflow,
  /permissions:\s*\n\s*contents: read/,
  'CI permissions must remain read-only'
);
assert.match(
  workflow,
  /cancel-in-progress: true/,
  'CI must continue cancelling stale runs'
);
assert.match(
  workflow,
  /node-version: ['"]22['"]/,
  'CI Node.js version must remain explicitly pinned'
);
assert.match(
  workflow,
  /run: node tests\/run-v150b2b-checks\.js/,
  'CI and the verification guide must use the same runner entrypoint'
);

const forbiddenWorkflowActions = [
  /supabase\s+(?:db\s+push|migration\s+up|functions\s+deploy|link)\b/i,
  /psql\b/i,
  /railops.*strict_rls\.sql/i,
  /vercel\s+(?:deploy|--prod)\b/i,
  /git\s+(?:push|merge)\b/i,
];
for (const pattern of forbiddenWorkflowActions) {
  assert.doesNotMatch(
    workflow,
    pattern,
    `verification CI must stay diagnostic-only and must not match ${pattern}`
  );
}

console.log('PASS: v150B-2B verification documentation and CI contract');
