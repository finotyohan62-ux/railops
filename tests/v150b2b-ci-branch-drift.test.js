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
  workflow.includes('merge_base_sha="$(git merge-base origin/main HEAD | cut -c1-12)"'),
  'drift diagnostic should capture the common ancestor used to contextualize divergence'
);
assert(
  workflow.includes('merge_base_date="$(git show -s --format=%cI "${merge_base_sha}")"'),
  'drift diagnostic should capture the common ancestor commit date'
);
assert(
  workflow.includes('main_only_file_count="$(git diff --name-only HEAD..origin/main | wc -l | tr -d'),
  'drift diagnostic should count all files changed only on main'
);
assert(
  workflow.includes('main_only_commit_count="$(git rev-list --count HEAD..origin/main)"'),
  'drift diagnostic should count all commits present only on main'
);
assert(
  workflow.includes('git diff --name-only HEAD..origin/main'),
  'drift diagnostic should list files changed only on main since the branch diverged'
);
assert(
  workflow.includes('Main-only changed files (up to 20):'),
  'step summary should expose a bounded main-only file list for compatibility triage'
);
assert(
  workflow.includes('head -n 20'),
  'main-only file diagnostics must stay bounded and readable'
);
assert(
  workflow.includes("git log --oneline --no-decorate HEAD..origin/main | head -n 12"),
  'drift diagnostic should list a bounded set of commits present on main but absent from the branch'
);
assert(
  workflow.includes('Main-only commits (up to 12):'),
  'step summary should expose bounded main-only commit subjects for compatibility triage'
);
assert(
  workflow.includes('Main-only changed file count:') && workflow.includes('${main_only_file_count}'),
  'step summary should expose the complete main-only changed-file count'
);
assert(
  workflow.includes('Main-only commit count:') && workflow.includes('${main_only_commit_count}'),
  'step summary should expose the complete main-only commit count'
);
assert(
  workflow.includes('app_file_count=') && workflow.includes('tests_file_count=') && workflow.includes('backend_file_count='),
  'drift diagnostic should classify main-only file impact into app, tests and backend areas'
);
assert(
  workflow.includes('Main-only impact: app=') && workflow.includes('tests=') && workflow.includes('backend='),
  'step summary should expose main-only impact counts by compatibility area'
);
assert(
  workflow.includes('Main SHA:') && workflow.includes('${main_sha}'),
  'step summary should record the main SHA used for the drift calculation'
);
assert(
  workflow.includes('Branch SHA:') && workflow.includes('${head_sha}'),
  'step summary should record the branch SHA used for the drift calculation'
);
assert(
  workflow.includes('Merge base:') && workflow.includes('${merge_base_sha}'),
  'step summary should record the common ancestor SHA'
);
assert(
  workflow.includes('Merge-base date:') && workflow.includes('${merge_base_date}'),
  'step summary should record the common ancestor date'
);
assert(
  workflow.includes('Branch drift is informational only; no merge or rebase is performed.'),
  'step summary must make the non-mutating nature of the diagnostic explicit'
);

console.log('PASS: v150B-2B CI reports branch drift with immutable comparison context, complete counts, impact categories and bounded main-only file/commit diagnostics');
