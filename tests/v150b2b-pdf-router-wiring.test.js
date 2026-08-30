const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bootstrap = fs.readFileSync(path.resolve(__dirname, '../js/reports/inspection-report-bootstrap.js'), 'utf8');
const sync = fs.readFileSync(path.resolve(__dirname, '../js/core/sync.js'), 'utf8');

assert.match(bootstrap, /require\(['"]\.\/pdf-action-router\.js['"]\)/);
assert.match(bootstrap, /RailOpsPdfActionRouter/);
assert.match(bootstrap, /classifyPdfAction/);
assert.match(sync, /pdf-action-router\.js/);
assert.ok(
  sync.indexOf('pdf-action-router.js') < sync.indexOf('inspection-report-bootstrap.js'),
  'PDF action router must load before report bootstrap in browser runtime'
);

console.log('PASS: report bootstrap is wired through safe PDF action router');
