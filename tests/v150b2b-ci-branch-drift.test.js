const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

assert(
  workflow.includes('fetch-depth: 0'),
  'checkout must keep enough history to diagnose drift against main'
);
assert(
  workflow.includes('name: Report branch drift (non-blocking)'),
  'workflow must report branch drift without changing repository state'
);
assert(
  workflow.includes('git fetch --no-tags origin main:refs/remotes/origin/main'),
  'drift diagnostic must refresh origin/main explicitly'
);
assert(
  workflow.includes("git rev-list --left-right --count origin/main...HEAD"),
  'drift diagnostic must compute behind/ahead counts from git history'
);
assert(
  workflow.includes('main_sha="$(git rev-parse --short=12 origin/main)"'),
  'drift diagnostic should capture the exact main commit being compared'
);
assert(
  workflow.includes('head_sha="$(git rev-parse --short=12 HEAD)"'),
  'drift diagnostic should capture the exact branch commit being compared'
);
assert(
  workflow.includes('Main SHA: **`${main_sha}`**'),
  'step summary should record the main SHA used for the drift calculation'
);
assert(
  workflow.includes('Branch SHA: **`${head_sha}`**'),
  'step summary should record the branch SHA used for the drift calculation'
);
assert(
  workflow.includes('Branch drift is informational only; no merge or rebase is performed.'),
  'step summary must make the non-mutating nature of the diagnostic explicit'
);

console.log('PASS: v150B-2B CI reports branch drift without mutating git state');
