const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const runner = fs.readFileSync(path.join(__dirname, 'run-v150b2b-checks.js'), 'utf8');

assert.match(
  runner,
  /process\.env\.GITHUB_STEP_SUMMARY/,
  'runner should publish a concise GitHub Actions step summary when the summary file is available'
);
assert.match(
  runner,
  /v150B-2B verification summary/,
  'step summary should have a stable heading for quick CI review'
);
assert.match(
  runner,
  /failures\.length/,
  'step summary should report the collected failure count rather than hiding partial failures'
);
assert.match(
  runner,
  /totalElapsedMs/,
  'step summary should include the total check duration already measured by the runner'
);
assert.match(
  runner,
  /Passed checks/,
  'step summary should report how many discovered checks completed successfully'
);
assert.match(
  runner,
  /passedChecks/,
  'passed-check count should be computed explicitly rather than inferred from a success banner'
);

console.log('PASS: v150B-2B runner publishes a concise GitHub Actions step summary');
