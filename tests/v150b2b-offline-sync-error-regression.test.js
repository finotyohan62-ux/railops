const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const target = 'tests/sync-error-handling.test.js';
const result = spawnSync(process.execPath, [target], {
  cwd: root,
  encoding: 'utf8',
  timeout: 30000,
});

assert.notEqual(result.error?.code, 'ETIMEDOUT', 'offline sync regression test must not time out');
assert.ifError(result.error);
assert.equal(
  result.status,
  0,
  `offline sync error-handling regression failed\n${result.stdout || ''}${result.stderr || ''}`
);
assert.match(
  result.stdout || '',
  /sync error handling checks passed \(6 cases\)/,
  'canonical offline sync regression must confirm all six retry/queue cases'
);

console.log('PASS: v150B-2B suite includes canonical offline sync error-handling regression');
