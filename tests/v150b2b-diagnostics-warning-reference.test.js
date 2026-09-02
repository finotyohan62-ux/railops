const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const diagnostics = fs.readFileSync(path.join(root, 'v150b2b-diagnostics.js'), 'utf8');
const reference = fs.readFileSync(path.join(root, 'docs/v150b2b-diagnostics-warning-reference.md'), 'utf8');

const runtimeCodes = [...diagnostics.matchAll(/warnings\.push\('([A-Z0-9_]+)'\)/g)].map(match => match[1]);
const documentedCodes = [...reference.matchAll(/^### `([A-Z0-9_]+)`$/gm)].map(match => match[1]);

assert.ok(runtimeCodes.length > 0, 'expected diagnostics warning codes to be discovered');
assert.deepEqual(
  [...new Set(runtimeCodes)].sort(),
  [...new Set(documentedCodes)].sort(),
  'diagnostics warning reference must document exactly the warning codes emitted by runtime diagnostics'
);
assert.equal(documentedCodes.length, new Set(documentedCodes).size, 'warning reference must not duplicate code sections');
assert.match(reference, /ne définit aucune règle métier/i, 'reference must state that it does not define business rules');
assert.match(reference, /ne pas modifier les données/i, 'reference must discourage data mutation as a diagnostic response');

console.log(`PASS: diagnostics warning reference covers ${runtimeCodes.length} runtime code(s)`);
