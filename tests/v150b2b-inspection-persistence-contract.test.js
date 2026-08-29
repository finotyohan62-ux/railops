const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/legacy-core.js'), 'utf8');

function section(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing runtime marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing runtime marker: ${endMarker}`);
  return source.slice(start, end);
}

const stateInit = section('const S=', ',APP_VERSION=');
assert.ok(
  stateInit.includes("'scans':[]"),
  'inspection state must keep the scans collection initialized'
);

const saveSource = section('async function save(){', 'async function loadPrixCatalogue');
assert.ok(
  saveSource.includes("'ro3_s'"),
  'inspection save must keep the stable local scans cache key'
);
assert.ok(
  saveSource.includes("['upsert']"),
  'pending inspection records must keep a server upsert path'
);
assert.ok(
  saveSource.includes("{'onConflict':'id'}"),
  'inspection persistence must remain idempotent by scan id'
);

const loadSource = section('async function load(){', 'function eL(');
const expectedColumns = 'id,materielId,chantierId,agentNom,date,etatGeneral,proprete,fonctionnement,dommages,dommagesDesc,observations,actions,photo,lat,lng,fournisseur';
assert.ok(
  loadSource.includes(expectedColumns),
  'inspection reload must request the complete display/persistence field contract, including fournisseur'
);
assert.ok(
  loadSource.includes('new Set(q'),
  'inspection reload must keep the remote-id set used to avoid duplicate local records'
);
assert.ok(
  loadSource.includes("A['id']"),
  'inspection reload merge must stay keyed by the stable inspection id'
);

console.log('PASS: inspection persistence contract is preserved (state, save, reload, id merge)');
