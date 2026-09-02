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
const canonicalSummary = (result.stdout || '').match(/sync error handling checks passed \((\d+) cases\)/);
assert.ok(canonicalSummary, 'canonical offline sync regression must report its retry/queue case count');
assert.ok(
  Number(canonicalSummary[1]) >= 6,
  `canonical offline sync regression must keep at least six retry/queue cases (reported ${canonicalSummary[1]})`
);

console.log('PASS: v150B-2B suite includes canonical offline sync error-handling regression');
