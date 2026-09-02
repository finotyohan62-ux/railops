const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const index = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const lifecycle = fs.readFileSync(path.resolve(__dirname, '..', 'js/core/lifecycle.js'), 'utf8');
const sync = fs.readFileSync(path.resolve(__dirname, '..', 'js/core/sync.js'), 'utf8');
const fileReaderHotfix = fs.readFileSync(path.resolve(__dirname, '..', 'js/core/register-import-filereader-hotfix.js'), 'utf8');

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
assert.match(lifecycle, /RailOpsRegisterImportToleranceV155/);
assert.match(lifecycle, /duplicateRows/);
assert.match(lifecycle, /declaredMismatch/);
assert.match(lifecycle, /window\.importCSV\s*=\s*tolerantImportV155/);

// Actual picker path in v145 calls generalizedImport directly, bypassing window.importCSV.
assert.match(index, /stopImmediatePropagation\(\);\s*generalizedImport\(input\)/);
assert.match(fileReaderHotfix, /window\.generalizedImport\s*=\s*importWithNativeFile/);
assert.match(fileReaderHotfix, /generalizedImport\s*=\s*importWithNativeFile/);

assert.match(fileReaderHotfix, /new\s+File\s*\(/);
assert.match(fileReaderHotfix, /RailOpsRegisterImportToleranceV155/);
assert.match(fileReaderHotfix, /normalizeWorkbook/);
assert.match(fileReaderHotfix, /baseImport\(\{files:\[syntheticFile\],value:''\}\)/);
assert.match(sync, /\.\/js\/core\/register-import-filereader-hotfix\.js/);
assert.match(lifecycle, /crossSiteDuplicate/);
assert.match(lifecycle, /return\s+null/);

console.log('PASS: safe tolerant multi-sheet register normalization is guarded');
