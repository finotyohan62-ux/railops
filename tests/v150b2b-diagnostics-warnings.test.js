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

const staleCatalogue = createDiagnosticsSnapshot({
  ...state,
  role: 'agent',
  prixCatalogue: [{ ref: 'CATALOGUE-SECRET', prix: 123 }],
}, {});
assert.deepEqual(
  staleCatalogue.warnings,
  ['CATALOGUE_SCOPE_LEAK'],
  'non Chef/Admin diagnostics must flag residual catalogue data without exposing catalogue contents'
);
assert.equal(JSON.stringify(staleCatalogue).includes('CATALOGUE-SECRET'), false);

const missingStats = createDiagnosticsSnapshot({
  ...state,
  chefChantierStats: [],
}, { online: true });
assert.deepEqual(
  missingStats.warnings,
  ['CHEF_CHANTIER_STATS_MISSING'],
  'an online Chef de chantier with visible chantiers must flag missing aggregate stats'
);

const offlineMissingStats = createDiagnosticsSnapshot({
  ...state,
  chefChantierStats: [],
}, { online: false });
assert.equal(
  Object.prototype.hasOwnProperty.call(offlineMissingStats, 'warnings'),
  false,
  'offline state must not report a server-stats warning'
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

const staleAnonymous = createDiagnosticsSnapshot({
  role: null,
  page: 'login',
  chantiers: [{ id: 'CHANTIER-SECRET' }],
  mat: [{ id: 'MATERIAL-SECRET' }],
  scans: [],
  users: [],
  chefChantierStats: [],
}, { online: true });
assert.deepEqual(
  staleAnonymous.warnings,
  ['SESSION_DATA_WITHOUT_ROLE'],
  'diagnostics must flag residual in-memory data when no RailOps role is active'
);

const serialized = JSON.stringify(leaked);
assert.equal(serialized.includes('MATERIAL-SECRET'), false);
assert.equal(serialized.includes('SCAN-SECRET'), false);
const serializedAnonymous = JSON.stringify(staleAnonymous);
assert.equal(serializedAnonymous.includes('CHANTIER-SECRET'), false);
assert.equal(serializedAnonymous.includes('MATERIAL-SECRET'), false);

console.log('PASS: v150B-2B diagnostics warnings are metadata-only and backward-compatible');
