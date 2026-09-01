const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const index = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

function between(start, end) {
  const a = index.indexOf(start);
  assert.notEqual(a, -1, `missing ${start}`);
  const b = index.indexOf(end, a);
  assert.notEqual(b, -1, `missing ${end}`);
  return index.slice(a, b);
}

const quality = between('function sourceQuality(sheet){', 'function qualityBlock(sheet){');
const workbook = between('function workbookModel(wb){', 'function sourceQuality(sheet){');

// A stale declared total and duplicates inside the same site are recoverable:
// parseSheet already deduplicates identical site/reference pairs deterministically.
assert.match(quality, /warnings/);
assert.match(quality, /declared\.count/);
assert.match(quality, /duplicates\.length/);
assert.match(quality, /crossSiteDuplicates\.length/);
assert.match(quality, /ok:\s*blocking\.length\s*===\s*0/);
assert.doesNotMatch(quality, /ok:\s*reasons\.length\s*===\s*0/);

// Cross-site duplicates remain a blocker because their destination is ambiguous.
assert.match(quality, /blocking\.push\([^\n]*plusieurs emplacements/);

// Every workbook tab is inspected before only exploitable register sheets are routed.
assert.match(workbook, /wb\.SheetNames/);
assert.match(workbook, /sheet_to_json/);
assert.match(workbook, /parseSheet/);

console.log('PASS: tolerant multi-sheet register import quality policy is guarded');
