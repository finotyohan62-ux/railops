const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const syncSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'sync.js'), 'utf8');

assert.match(syncSource, /pdf-design-system\.js/);
assert.match(syncSource, /inspection-report\.js/);
assert.match(syncSource, /inspection-report-ui\.js/);
assert.match(syncSource, /inspection-report-bootstrap\.js/);
assert.ok(
  syncSource.indexOf('pdf-design-system.js') < syncSource.indexOf('inspection-report.js'),
  'common PDF design must load before the inspection report renderer'
);
assert.match(syncSource, /typeof document/);

console.log('PASS: browser runtime loads common PDF design before report modules');
