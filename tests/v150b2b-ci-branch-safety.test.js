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
assert.doesNotMatch(
  workflow,
  /\bpull_request_target\s*:/,
  'v150B-2B workflow must not run with pull_request_target privileges'
);
assert.doesNotMatch(
  workflow,
  /\bworkflow_run\s*:/,
  'v150B-2B workflow must not be chained from another workflow run'
);
assert.doesNotMatch(
  workflow,
  /^\s*schedule\s*:/m,
  'v150B-2B workflow must remain event-scoped and not become scheduled automation'
);
assert.doesNotMatch(
  workflow,
  /^\s*workflow_dispatch\s*:/m,
  'v150B-2B workflow must not gain a manual trigger outside the branch verification flow'
);
assert.doesNotMatch(
  workflow,
  /^\s*repository_dispatch\s*:/m,
  'v150B-2B workflow must not accept external repository dispatch events'
);
assert.match(
  workflow,
  /permissions:\s*\n\s+contents:\s*read\b/,
  'v150B-2B workflow must keep repository contents read-only'
);
const permissionsBlock = workflow.match(/^permissions:\s*\n((?:^[ \t]+[^\n]+\n?)*)/m)?.[1] || '';
const explicitPermissions = permissionsBlock
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean);
assert.deepEqual(
  explicitPermissions,
  ['contents: read'],
  'v150B-2B workflow must not gain permissions beyond contents: read'
);
assert.doesNotMatch(
  workflow,
  /\bsecrets\.[A-Za-z0-9_]+\b/,
  'v150B-2B workflow must not consume repository or environment secrets'
);
assert.doesNotMatch(
  workflow,
  /^\s+environment\s*:/m,
  'v150B-2B diagnostic checks must not attach to a GitHub deployment environment'
);
assert.match(
  workflow,
  /persist-credentials:\s*false\b/,
  'checkout credentials must not persist in the v150B-2B workflow'
);
assert.match(
  workflow,
  /fetch-depth:\s*0\b/,
  'checkout must keep full history so branch-drift diagnostics remain accurate'
);
assert.match(
  workflow,
  /concurrency:[\s\S]*?cancel-in-progress:\s*true\b/,
  'v150B-2B workflow must cancel superseded duplicate runs'
);
assert.match(
  workflow,
  /jobs:[\s\S]*?checks:[\s\S]*?timeout-minutes:\s*5\b/,
  'v150B-2B checks must keep the five-minute runaway guard'
);
assert.match(
  workflow,
  /- name: Report branch drift \(non-blocking\)[\s\S]*?if:\s*github\.event_name\s*==\s*'push'[\s\S]*?continue-on-error:\s*true\b/,
  'branch drift reporting must remain push-only and non-blocking'
);
assert.match(
  workflow,
  /- name: Setup Node\.js\s*\n\s+uses:\s*actions\/setup-node@v4\s*\n\s+with:\s*\n\s+node-version:\s*['"]22['"]\s*(?:\n|$)/,
  'v150B-2B checks must keep the explicit Node 22 runtime'
);
assert.match(
  workflow,
  /- name: Run v150B-2B verification suite\s*\n\s+run:\s*node tests\/run-v150b2b-checks\.js\s*$/m,
  'v150B-2B verification must continue to run directly with Node'
);
assert.doesNotMatch(
  workflow,
  /^\s*(?:run:\s*)?(?:npm|npx|pnpm|yarn|bun|bunx)\s+(?:install|ci|add|exec|dlx)\b/im,
  'v150B-2B workflow must not add package-install or package-exec steps'
);

const forbiddenMutations = [
  { label: 'contents write permission', pattern: /contents:\s*write\b/i },
  { label: 'write-all permission', pattern: /permissions:\s*write-all\b/i },
  { label: 'git push command', pattern: /^\s*git\s+push\b/im },
  { label: 'git merge command', pattern: /^\s*git\s+merge\b/im },
  { label: 'git rebase command', pattern: /^\s*git\s+rebase\b/im },
  { label: 'git cherry-pick command', pattern: /^\s*git\s+cherry-pick\b/im },
  { label: 'git commit command', pattern: /^\s*git\s+commit\b/im },
  { label: 'git checkout command', pattern: /^\s*git\s+checkout\b/im },
  { label: 'git switch command', pattern: /^\s*git\s+switch\b/im },
  { label: 'git branch mutation surface', pattern: /^\s*git\s+branch\b/im },
  { label: 'git tag mutation surface', pattern: /^\s*git\s+tag\b/im },
  { label: 'git update-ref command', pattern: /^\s*git\s+update-ref\b/im },
  { label: 'git clean command', pattern: /^\s*git\s+clean\b/im },
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
