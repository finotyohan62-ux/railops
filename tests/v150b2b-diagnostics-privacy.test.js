const assert = require('node:assert/strict');
const { createDiagnosticsSnapshot } = require('../v150b2b-diagnostics.js');

const state = {
  role: 'chef',
  isAdminOwner: false,
  __ownerAdminMode: false,
  page: 'dashboard',
  agent: 'PRIVATE_AGENT_NAME',
  chantiers: [{ id: 'PRIVATE_CHANTIER_ID', nom: 'PRIVATE_CHANTIER_NAME' }],
  mat: [{ id: 'PRIVATE_MATERIAL_REF', scan: 'PRIVATE_QR_VALUE', photo: 'PRIVATE_PHOTO_DATA' }],
  scans: [{ id: 'PRIVATE_SCAN_ID', observations: 'PRIVATE_SCAN_CONTENT', lat: 50.1, lng: 1.8 }],
  users: [{ id: 'PRIVATE_USER_ID', nom: 'PRIVATE_USER_NAME', badge: 'PRIVATE_BADGE' }],
  chefChantierStats: [{ chantier_id: 'PRIVATE_STATS_CHANTIER_ID', total_materiels: 1 }],
};

const snapshot = createDiagnosticsSnapshot(state, { version: 'privacy-test', online: true });
const serialized = JSON.stringify(snapshot);

assert.deepEqual(
  Object.keys(snapshot).sort(),
  ['adminMode', 'adminOwner', 'counts', 'online', 'page', 'role', 'version'].sort(),
  'healthy diagnostics must expose metadata/counts only'
);
assert.deepEqual(
  Object.keys(snapshot.counts).sort(),
  ['chantiers', 'materials', 'scans', 'users', 'chefChantierStats'].sort(),
  'diagnostic counts must stay aggregate-only'
);

for (const secret of [
  'PRIVATE_AGENT_NAME',
  'PRIVATE_CHANTIER_ID',
  'PRIVATE_CHANTIER_NAME',
  'PRIVATE_MATERIAL_REF',
  'PRIVATE_QR_VALUE',
  'PRIVATE_PHOTO_DATA',
  'PRIVATE_SCAN_ID',
  'PRIVATE_SCAN_CONTENT',
  'PRIVATE_USER_ID',
  'PRIVATE_USER_NAME',
  'PRIVATE_BADGE',
  'PRIVATE_STATS_CHANTIER_ID',
]) {
  assert.equal(serialized.includes(secret), false, `diagnostics must not expose ${secret}`);
}

assert.deepEqual(snapshot.counts, {
  chantiers: 1,
  materials: 1,
  scans: 1,
  users: 1,
  chefChantierStats: 1,
});

console.log('v150b2b diagnostics privacy contract: OK');
