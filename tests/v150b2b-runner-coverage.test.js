const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
  runner.includes("preview.matchAll(/\\.\\/(v150b2b-[a-z0-9-]+\\.js)\\?build=/gi)"),
  'aggregate runner must derive syntax targets from the preview script list'
);

const testFiles = fs.readdirSync(__dirname)
  .filter(name => /^v150b2b-.*\.test\.js$/i.test(name))
  .sort();
assert(testFiles.length > 0, 'tests directory must contain v150B-2B test files');

const previewScripts = [...preview.matchAll(/\.\/(v150b2b-[a-z0-9-]+\.js)\?build=/gi)]
  .map(match => match[1]);
const uniquePreviewScripts = [...new Set(previewScripts)].sort();
assert(uniquePreviewScripts.length > 0, 'preview must expose at least one v150B-2B JavaScript module');

assert(
  !runner.includes("const tests = ["),
  'aggregate runner should not require a manually maintained test manifest'
);
assert(
  !runner.includes("'v150b2b-loader.js',"),
  'aggregate runner should not require a manually maintained preview module manifest'
);

console.log(`PASS: aggregate runner auto-discovers ${testFiles.length} tests and ${uniquePreviewScripts.length} preview JavaScript modules`);
