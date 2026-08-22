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

console.log(`PASS: aggregate runner auto-discovers ${testFiles.length} tests and ${uniquePreviewScripts.length} preview JavaScript modules with per-check diagnostics and timeout guards`);
