const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const syncSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'sync.js'), 'utf8');

assert.match(syncSource, /inspection-report\.js/);
assert.match(syncSource, /inspection-report-ui\.js/);
assert.match(syncSource, /inspection-report-bootstrap\.js/);
assert.match(syncSource, /typeof document/);

console.log('PASS: browser runtime loads approved inspection report modules');
