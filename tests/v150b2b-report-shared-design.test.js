const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const reportPath = path.resolve(__dirname, '../js/reports/inspection-report.js');
const source = fs.readFileSync(reportPath, 'utf8');

assert.match(
  source,
  /require\(['"]\.\/pdf-design-system\.js['"]\)/,
  'inspection report must consume the common RailOps PDF design module in Node'
);
assert.match(
  source,
  /RailOpsPdfDesignSystem/,
  'inspection report must consume the common RailOps PDF design module in browser runtime'
);
assert.doesNotMatch(
  source,
  /@page\{size:A4;margin:14mm\}/,
  'inspection report must not keep its own duplicated A4 design shell'
);

console.log('PASS: inspection report uses shared RailOps PDF design');
