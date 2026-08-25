const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runner = fs.readFileSync(path.join(root, 'tests/run-v150b2b-checks.js'), 'utf8');

assert.match(runner, /process\.env\.GITHUB_EVENT_NAME\s*\|\|\s*['"]local['"]/, 'runner should capture the GitHub event name');
assert.match(runner, /process\.env\.GITHUB_RUN_ID\s*\|\|\s*['"]local['"]/, 'runner should capture the GitHub run id');
assert.match(runner, /event=\$\{runEvent\}/, 'console context should include the event name');
assert.match(runner, /run=\$\{runId\}/, 'console context should include the run id');
assert.match(runner, /`- Event: \\`\$\{runEvent\}\\``/, 'step summary should include the event name');
assert.match(runner, /`- Run ID: \\`\$\{runId\}\\``/, 'step summary should include the run id');

console.log('PASS: v150B-2B CI context includes event and run id');
