const assert = require('node:assert/strict');
const { createDiagnosticsSnapshot } = require('../v150b2b-diagnostics.js');

function warningsFor(state, runtime = { online: false }) {
  return createDiagnosticsSnapshot(state, runtime).warnings || [];
}

const offlineChefWarnings = warningsFor({
  role: 'chef_chantier',
  page: 'dashboard',
  chantiers: [{ id: 'C-SECRET' }],
  mat: [{ id: 'M-SECRET' }],
  scans: [{ id: 'S-SECRET' }],
  chefChantierStats: [],
});

assert.equal(
  offlineChefWarnings.includes('CHEF_CHANTIER_STATS_MISSING'),
  false,
  'offline mode must suppress only the server-statistics availability warning'
);
assert.equal(
  offlineChefWarnings.includes('CHEF_CHANTIER_MATERIAL_SCOPE_LEAK'),
  true,
  'offline mode must keep material scope-leak diagnostics active'
);
assert.equal(
  offlineChefWarnings.includes('CHEF_CHANTIER_SCAN_SCOPE_LEAK'),
  true,
  'offline mode must keep scan scope-leak diagnostics active'
);

const offlineSessionWarnings = warningsFor({
  role: null,
  page: 'dashboard',
  chantiers: [{ id: 'C-SECRET' }],
});

assert.equal(
  offlineSessionWarnings.includes('SESSION_PAGE_WITHOUT_ROLE'),
  true,
  'offline mode must keep session/page invariant diagnostics active'
);
assert.equal(
  offlineSessionWarnings.includes('SESSION_DATA_WITHOUT_ROLE'),
  true,
  'offline mode must keep session/data invariant diagnostics active'
);

console.log('PASS: offline diagnostics suppress only connectivity-dependent warnings');
