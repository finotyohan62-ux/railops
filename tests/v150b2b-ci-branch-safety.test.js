const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

assert.match(
  workflow,
  /push:\s*\n\s+branches:\s*\n\s+- security\/v150b2b-rls-ready/,
  'v150B-2B push checks must stay scoped to security/v150b2b-rls-ready'
);
assert.match(
  workflow,
  /pull_request:\s*\n\s+branches:\s*\n\s+- main/,
  'v150B-2B pull-request checks must keep main as the review target'
);
assert.match(
  workflow,
  /permissions:\s*\n\s+contents:\s*read\b/,
  'v150B-2B workflow must keep repository contents read-only'
);
assert.match(
  workflow,
  /persist-credentials:\s*false\b/,
  'checkout credentials must not persist in the v150B-2B workflow'
);

const forbiddenMutations = [
  { label: 'contents write permission', pattern: /contents:\s*write\b/i },
  { label: 'write-all permission', pattern: /permissions:\s*write-all\b/i },
  { label: 'git push command', pattern: /^\s*git\s+push\b/im },
  { label: 'git merge command', pattern: /^\s*git\s+merge\b/im },
  { label: 'git rebase command', pattern: /^\s*git\s+rebase\b/im },
  { label: 'git cherry-pick command', pattern: /^\s*git\s+cherry-pick\b/im },
  { label: 'forced reset command', pattern: /^\s*git\s+reset\s+--hard\b/im },
  { label: 'Vercel production deploy', pattern: /\bvercel\b[^\n]*\b(?:deploy\b[^\n]*--prod|--prod\b)/i },
  { label: 'Supabase database push', pattern: /\bsupabase\s+db\s+push\b/i },
  { label: 'Supabase migration apply', pattern: /\bsupabase\s+migration\s+(?:up|repair)\b/i },
  { label: 'Supabase function deploy', pattern: /\bsupabase\s+functions\s+deploy\b/i },
  { label: 'deployment action', pattern: /uses:\s*[^\n]*(?:vercel|supabase)[^\n]*(?:deploy|production)/i },
];

for (const rule of forbiddenMutations) {
  assert.doesNotMatch(
    workflow,
    rule.pattern,
    `v150B-2B workflow must remain diagnostic/read-only: ${rule.label}`
  );
}

console.log('v150b2b CI branch safety: OK');
