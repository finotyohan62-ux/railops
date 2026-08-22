const assert = require('node:assert/strict');
const { createDiagnosticsSnapshot } = require('../v150b2b-diagnostics.js');

const state = {
  agent: 'Sensitive Name',
  role: 'chef_chantier',
  isAdminOwner: false,
  __ownerAdminMode: false,
  page: 'dashboard',
  chantiers: [{ id: 'C-SECRET' }, { id: 'C-2' }],
  mat: [],
  scans: [],
  users: [{ id: 'U-SECRET' }],
  chefChantierStats: [{ chantier_id: 'C-SECRET' }],
};

const snapshot = createDiagnosticsSnapshot(state, {
  version: '150B2B-client-2',
  online: true,
});

assert.deepEqual(snapshot, {
  version: '150B2B-client-2',
  role: 'chef_chantier',
  adminOwner: false,
  adminMode: false,
  page: 'dashboard',
  online: true,
  counts: {
    chantiers: 2,
    materials: 0,
    scans: 0,
    users: 1,
    chefChantierStats: 1,
  },
});

const serialized = JSON.stringify(snapshot);
for (const secret of ['Sensitive Name', 'C-SECRET', 'U-SECRET']) {
  assert.equal(serialized.includes(secret), false, `diagnostics must not expose ${secret}`);
}

assert.deepEqual(
  createDiagnosticsSnapshot(null, {}),
  {
    version: null,
    role: null,
    adminOwner: false,
    adminMode: false,
    page: null,
    online: null,
    counts: { chantiers: 0, materials: 0, scans: 0, users: 0, chefChantierStats: 0 },
  },
  'diagnostics must be safe on an empty state'
);

console.log('PASS: v150B-2B diagnostics snapshot is metadata-only');
