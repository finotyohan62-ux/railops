const assert = require('node:assert/strict');
const { createDiagnosticsSnapshot } = require('../v150b2b-diagnostics.js');

const snapshot = createDiagnosticsSnapshot({
  role: 'chef_chantier',
  page: 'dashboard',
  chantiers: [{ id: 'C-1' }],
  mat: [{ id: 'M-1' }],
  scans: [{ id: 'S-1' }],
  chefChantierStats: [],
  prixCatalogue: [{ ref: 'P-1' }],
  isAdminOwner: false,
  __ownerAdminMode: true,
}, { online: true });

assert.deepEqual(
  snapshot.warnings,
  [
    'CHEF_CHANTIER_MATERIAL_SCOPE_LEAK',
    'CHEF_CHANTIER_SCAN_SCOPE_LEAK',
    'CHEF_CHANTIER_STATS_MISSING',
    'CATALOGUE_SCOPE_LEAK',
    'OWNER_ADMIN_MODE_ROLE_MISMATCH',
    'OWNER_ADMIN_MODE_WITHOUT_OWNER',
  ],
  'diagnostic warnings must keep a deterministic severity-neutral order for stable support logs'
);

assert.equal(
  new Set(snapshot.warnings).size,
  snapshot.warnings.length,
  'diagnostic warnings must not contain duplicates when several invariants fail together'
);

console.log('PASS: v150B-2B diagnostics warning ordering is deterministic and duplicate-free');
