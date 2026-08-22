const assert = require('node:assert/strict');
const { createDiagnosticsSnapshot } = require('../v150b2b-diagnostics.js');

const state = {
  role: 'chef_chantier',
  isAdminOwner: false,
  __ownerAdminMode: false,
  page: 'dashboard',
  chantiers: [{ id: 'A' }],
  mat: [],
  scans: [],
  users: [],
  chefChantierStats: [{ chantier_id: 'A' }],
};

const healthy = createDiagnosticsSnapshot(state, {
  version: '150B2B-client-2',
  online: true,
});
assert.equal(
  Object.prototype.hasOwnProperty.call(healthy, 'warnings'),
  false,
  'healthy diagnostics must preserve the existing snapshot shape'
);

const leaked = createDiagnosticsSnapshot({
  ...state,
  mat: [{ id: 'MATERIAL-SECRET' }],
  scans: [{ id: 'SCAN-SECRET' }],
}, {});
assert.deepEqual(
  leaked.warnings,
  ['CHEF_CHANTIER_MATERIAL_SCOPE_LEAK', 'CHEF_CHANTIER_SCAN_SCOPE_LEAK'],
  'Chef de chantier diagnostics must flag material/scan scope anomalies without exposing their contents'
);

const ownerMismatch = createDiagnosticsSnapshot({
  ...state,
  role: 'chef',
  isAdminOwner: true,
  __ownerAdminMode: true,
}, {});
assert.deepEqual(
  ownerMismatch.warnings,
  ['OWNER_ADMIN_MODE_ROLE_MISMATCH'],
  'admin mode must be diagnosable when the effective role is not admin'
);

const serialized = JSON.stringify(leaked);
assert.equal(serialized.includes('MATERIAL-SECRET'), false);
assert.equal(serialized.includes('SCAN-SECRET'), false);

console.log('PASS: v150B-2B diagnostics warnings are metadata-only and backward-compatible');
