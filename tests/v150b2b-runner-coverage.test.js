const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runner = fs.readFileSync(path.join(__dirname, 'run-v150b2b-checks.js'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'v150b2b-test.html'), 'utf8');

assert(
  runner.includes('tests/v150b2b-runner-coverage.test.js'),
  'aggregate runner must execute the runner coverage guard'
);

const testFiles = fs.readdirSync(__dirname)
  .filter(name => /^v150b2b-.*\.test\.js$/i.test(name))
  .sort();
assert(testFiles.length > 0, 'tests directory must contain v150B-2B test files');
for (const testFile of testFiles) {
  assert(
    runner.includes(`'tests/${testFile}'`),
    `aggregate runner must execute ${testFile}`
  );
}

const previewScripts = [...preview.matchAll(/\.\/(v150b2b-[a-z0-9-]+\.js)\?build=/gi)]
  .map(match => match[1]);
const uniquePreviewScripts = [...new Set(previewScripts)];

assert(uniquePreviewScripts.length > 0, 'preview must expose at least one v150B-2B JavaScript module');
for (const script of uniquePreviewScripts) {
  assert(
    runner.includes(`'${script}'`),
    `aggregate runner must syntax-check preview module ${script}`
  );
}

console.log(`PASS: aggregate runner covers ${testFiles.length} tests and ${uniquePreviewScripts.length} preview JavaScript modules`);
