const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const index = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const lifecycle = fs.readFileSync(path.resolve(__dirname, '..', 'js/core/lifecycle.js'), 'utf8');
const sync = fs.readFileSync(path.resolve(__dirname, '..', 'js/core/sync.js'), 'utf8');
const unifiedPath = path.resolve(__dirname, '..', 'js/core/register-import-v156.js');
assert.equal(fs.existsSync(unifiedPath), true, 'missing unified register import module');
const unified = fs.readFileSync(unifiedPath, 'utf8');

function between(source, start, end) {
  const a = source.indexOf(start);
  assert.notEqual(a, -1, `missing ${start}`);
  const b = source.indexOf(end, a);
  assert.notEqual(b, -1, `missing ${end}`);
  return source.slice(a, b);
}

const workbook = between(index, 'function workbookModel(wb){', 'function sourceQuality(sheet){');
assert.match(workbook, /wb\.SheetNames/);
assert.match(workbook, /sheet_to_json/);
assert.match(workbook, /parseSheet/);

// Unified v156 is the only active picker entry point. v145 remains the business engine.
assert.match(index, /RailOpsRegisterImportV156\.handleInput\(input\)/);
assert.doesNotMatch(index, /stopImmediatePropagation\(\);\s*generalizedImport\(input\)/);
assert.match(sync, /\.\/js\/core\/register-import-v156\.js/);
assert.doesNotMatch(sync, /\.\/js\/core\/register-import-filereader-hotfix\.js/);

// The unified module owns recoverable normalization and forwards to v145 exactly once.
assert.match(unified, /RailOpsRegisterImportV156/);
assert.match(unified, /normalizeStructuredRows/);
assert.match(unified, /normalizeWorkbook/);
assert.match(unified, /duplicateRows/);
assert.match(unified, /declaredMismatch/);
assert.match(unified, /crossSiteDuplicate/);
assert.match(unified, /new\s+File\s*\(/);
assert.match(unified, /baseImport/);

// Existing v145 workbook routing and quality logic are kept intact.
assert.match(lifecycle, /RailOpsRegisterImportToleranceV155/);
assert.match(lifecycle, /crossSiteDuplicate/);

console.log('PASS: unified register import entry point is guarded');
