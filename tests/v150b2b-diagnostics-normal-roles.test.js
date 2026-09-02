const assert = require('node:assert/strict');
const { createDiagnosticsSnapshot } = require('../v150b2b-diagnostics.js');

function warningsFor(state, runtime = { online: true }) {
  return createDiagnosticsSnapshot(state, runtime).warnings || [];
}

const cleanRoleStates = [
  {
    label: 'agent',
    state: {
      role: 'agent',
      page: 'dashboard',
      chantiers: [{ id: 'C-1' }],
      mat: [{ id: 'M-1' }],
      scans: [{ id: 'S-1' }],
      users: [],
      chefChantierStats: [],
      prixCatalogue: [],
      isAdminOwner: false,
      __ownerAdminMode: false,
    },
  },
  {
    label: 'chef',
    state: {
      role: 'chef',
      page: 'dashboard',
      chantiers: [{ id: 'C-1' }],
      mat: [{ id: 'M-1' }],
      scans: [{ id: 'S-1' }],
      users: [{ id: 'U-1' }],
      chefChantierStats: [],
      prixCatalogue: [{ ref: 'P-1' }],
      isAdminOwner: false,
      __ownerAdminMode: false,
    },
  },
  {
    label: 'owner admin mode',
    state: {
      role: 'admin',
      page: 'dashboard',
      chantiers: [{ id: 'C-1' }],
      mat: [{ id: 'M-1' }],
      scans: [{ id: 'S-1' }],
      users: [{ id: 'U-1' }],
      chefChantierStats: [],
      prixCatalogue: [{ ref: 'P-1' }],
      isAdminOwner: true,
      __ownerAdminMode: true,
    },
  },
  {
    label: 'logged out',
    state: {
      role: null,
      page: 'login',
      chantiers: [],
      mat: [],
      scans: [],
      users: [],
      chefChantierStats: [],
      prixCatalogue: [],
      isAdminOwner: false,
      __ownerAdminMode: false,
    },
  },
];

for (const testCase of cleanRoleStates) {
  assert.deepEqual(
    warningsFor(testCase.state),
    [],
    `diagnostics must not emit false-positive warnings for a normal ${testCase.label} state`
  );
}

console.log('PASS: v150B-2B diagnostics remain quiet for normal role/session states');
