const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const index = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const lifecycle = fs.readFileSync(path.resolve(__dirname, '..', 'js/core/lifecycle.js'), 'utf8');

function between(source, start, end) {
  const a = source.indexOf(start);
  assert.notEqual(a, -1, `missing ${start}`);
  const b = source.indexOf(end, a);
  assert.notEqual(b, -1, `missing ${end}`);
  return source.slice(a, b);
}

const workbook = between(index, 'function workbookModel(wb){', 'function sourceQuality(sheet){');

// The v145 reader must inspect every workbook tab before selecting exploitable sheets.
assert.match(workbook, /wb\.SheetNames/);
assert.match(workbook, /sheet_to_json/);
assert.match(workbook, /parseSheet/);

// A post-load compatibility adapter must keep v145 business rules, while normalizing
// recoverable register defects before handing the workbook back to the original importer.
assert.match(lifecycle, /RailOpsRegisterImportToleranceV155/);
assert.match(lifecycle, /SheetNames/);
assert.match(lifecycle, /sheet_to_json/);
assert.match(lifecycle, /aoa_to_sheet/);
assert.match(lifecycle, /duplicateRows/);
assert.match(lifecycle, /declaredMismatch/);
assert.match(lifecycle, /baseImport/);
assert.match(lifecycle, /window\.importCSV\s*=\s*tolerantImportV155/);

// The legacy v132 importer passes its file to FileReader.readAsArrayBuffer, therefore the
// normalized workbook must be handed back as a genuine File/Blob, not a plain object.
assert.match(lifecycle, /new\s+File\s*\(/);
assert.doesNotMatch(lifecycle, /const\s+syntheticFile\s*=\s*\{/);

// Ambiguous cross-site duplicates must not be silently normalized.
assert.match(lifecycle, /crossSiteDuplicate/);
assert.match(lifecycle, /return\s+null/);

console.log('PASS: safe tolerant multi-sheet register normalization is guarded');
