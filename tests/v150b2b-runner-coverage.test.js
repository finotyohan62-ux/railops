const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { extractPreviewModules } = require('./v150b2b-preview-modules.js');

const root = path.resolve(__dirname, '..');
const runner = fs.readFileSync(path.join(__dirname, 'run-v150b2b-checks.js'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'v150b2b-test.html'), 'utf8');

assert(
  runner.includes("fs.readdirSync(__dirname)"),
  'aggregate runner must discover v150B-2B tests from the tests directory'
);
assert(
  runner.includes("/^v150b2b-.*\\.test\\.js$/i"),
  'aggregate runner must use the v150B-2B test filename contract'
);
assert(
  runner.includes("require('./v150b2b-preview-modules.js')") && runner.includes('extractPreviewModules(preview)'),
  'aggregate runner must derive syntax targets through the shared preview module discovery helper'
);

const testFiles = fs.readdirSync(__dirname)
  .filter(name => /^v150b2b-.*\.test\.js$/i.test(name))
  .sort();
assert(testFiles.length > 0, 'tests directory must contain v150B-2B test files');

const uniquePreviewScripts = extractPreviewModules(preview);
assert(uniquePreviewScripts.length > 0, 'preview must expose at least one v150B-2B JavaScript module');

assert(
  !runner.includes("const tests = ["),
  'aggregate runner should not require a manually maintained test manifest'
);
assert(
  !runner.includes("'v150b2b-loader.js',"),
  'aggregate runner should not require a manually maintained preview module manifest'
);
assert(
  runner.includes('PASS: ${label}'),
  'aggregate runner must identify each successful check in CI output'
);
assert(
  runner.includes('FAIL: ${label} exited with code ${result.status ?? 1}'),
  'aggregate runner must identify the exact failed check and exit code in CI output'
);
assert(
  runner.includes('const CHECK_TIMEOUT_MS = 30000;'),
  'aggregate runner must cap each child check so one hung test cannot consume the full workflow timeout'
);
assert(
  runner.includes('timeout: CHECK_TIMEOUT_MS'),
  'aggregate runner must apply the per-check timeout to spawned Node processes'
);
assert(
  runner.includes('FAIL: ${label} timed out after ${CHECK_TIMEOUT_MS}ms'),
  'aggregate runner must report a clear timeout diagnostic for the exact hung check'
);
assert(
  runner.includes('const startedAt = Date.now();'),
  'aggregate runner must timestamp the start of each child check'
);
assert(
  runner.includes('const elapsedMs = Date.now() - startedAt;'),
  'aggregate runner must calculate elapsed time for each child check'
);
assert(
  runner.includes('PASS: ${label} (${elapsedMs}ms)'),
  'aggregate runner must include each successful check duration in CI output'
);
assert(
  runner.includes("process.env.GITHUB_REF_NAME || 'local'"),
  'aggregate runner must identify the GitHub ref or local execution context'
);
assert(
  runner.includes("process.env.GITHUB_SHA?.slice(0, 12) || 'local'"),
  'aggregate runner must include a compact GitHub SHA or local marker'
);
assert(
  runner.includes('node=${process.version} ref=${runRef} sha=${runSha}'),
  'aggregate runner must print Node, ref and SHA diagnostics before checks run'
);
assert(
  runner.includes('const failures = [];') && runner.includes('failures.push('),
  'aggregate runner must collect failures instead of stopping at the first failing check'
);
assert(
  runner.includes('FAIL: ${failures.length} v150B-2B check(s) failed'),
  'aggregate runner must print one concise failure summary after all checks have run'
);
assert(
  runner.includes('const durations = [];') && runner.includes('durations.push({ label, elapsedMs })'),
  'aggregate runner must collect per-check durations for an end-of-run summary'
);
assert(
  runner.includes('ℹ slowest checks:') && runner.includes('.sort((a,b)=>b.elapsedMs-a.elapsedMs)') && runner.includes('.slice(0,3)'),
  'aggregate runner must print the three slowest checks to make CI performance regressions obvious'
);
assert(
  runner.includes('const totalElapsedMs = durations.reduce(') && runner.includes('ℹ total check time: ${totalElapsedMs}ms'),
  'aggregate runner must print total child-check time so global CI cost drift is visible'
);
assert(
  runner.includes('const failureReasonCounts = failures.reduce(') && runner.includes('ℹ failure reasons:'),
  'aggregate runner must group failure reasons so repeated timeout/exit patterns are obvious at a glance'
);
assert(
  runner.includes('Failure reasons:') && runner.includes('failureReasonSummary'),
  'GitHub step summary must include grouped failure reasons when checks fail'
);

console.log(`PASS: aggregate runner auto-discovers ${testFiles.length} tests and ${uniquePreviewScripts.length} preview JavaScript modules with per-check diagnostics, durations, timeout guards, CI context, complete failure collection, grouped failure reasons, slowest-check summary and total check time`);
