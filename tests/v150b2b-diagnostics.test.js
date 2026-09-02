const assert = require('node:assert/strict');
const { createDiagnosticsSnapshot } = require('../v150b2b-diagnostics.js');

const state = {
  agent: 'Sensitive Name',
  role: 'chef_chantier',
  badge: 'BADGE-SECRET',
  mdp: 'PASSWORD-SECRET',
  password: 'PASSWORD-ALT-SECRET',
  accessToken: 'ACCESS-TOKEN-SECRET',
  refreshToken: 'REFRESH-TOKEN-SECRET',
  isAdminOwner: false,
  __ownerAdminMode: false,
  page: 'dashboard',
  chantiers: [{ id: 'C-SECRET' }, { id: 'C-2' }],
  mat: [],
  scans: [{ id: 'SCAN-PENDING-SECRET', _pending: true }, { id: 'SCAN-SYNCED-SECRET' }],
  users: [{ id: 'U-SECRET', badge: 'USER-BADGE-SECRET', mdp: 'USER-PASSWORD-SECRET' }],
  chefChantierStats: [{ chantier_id: 'C-SECRET' }],
};
const stateBeforeDiagnostics = JSON.stringify(state);

const snapshot = createDiagnosticsSnapshot(state, {
  version: '150B2B-client-2',
  online: true,
  accessToken: 'RUNTIME-ACCESS-TOKEN-SECRET',
  refreshToken: 'RUNTIME-REFRESH-TOKEN-SECRET',
  apiKey: 'RUNTIME-API-KEY-SECRET',
});

assert.equal(
  JSON.stringify(state),
  stateBeforeDiagnostics,
  'diagnostics must not mutate application state'
);

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
    scans: 2,
    pendingScans: 1,
    users: 1,
    chefChantierStats: 1,
  },
  warnings: ['CHEF_CHANTIER_SCAN_SCOPE_LEAK'],
});

const serialized = JSON.stringify(snapshot);
for (const secret of [
  'Sensitive Name',
  'C-SECRET',
  'U-SECRET',
  'SCAN-PENDING-SECRET',
  'SCAN-SYNCED-SECRET',
  'BADGE-SECRET',
  'PASSWORD-SECRET',
  'PASSWORD-ALT-SECRET',
  'ACCESS-TOKEN-SECRET',
  'REFRESH-TOKEN-SECRET',
  'USER-BADGE-SECRET',
  'USER-PASSWORD-SECRET',
  'RUNTIME-ACCESS-TOKEN-SECRET',
  'RUNTIME-REFRESH-TOKEN-SECRET',
  'RUNTIME-API-KEY-SECRET',
]) {
  assert.equal(serialized.includes(secret), false, `diagnostics must not expose ${secret}`);
}

for (const forbiddenKey of ['agent', 'badge', 'mdp', 'password', 'accessToken', 'refreshToken', 'apiKey']) {
  assert.equal(
    Object.prototype.hasOwnProperty.call(snapshot, forbiddenKey),
    false,
    `diagnostics must not expose the ${forbiddenKey} field`
  );
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
    counts: { chantiers: 0, materials: 0, scans: 0, pendingScans: 0, users: 0, chefChantierStats: 0 },
  },
  'diagnostics must be safe on an empty state'
);

assert.equal(
  createDiagnosticsSnapshot({ scans: [
    { _pending: true },
    { _pending: 1 },
    { _pending: 'true' },
    { _pending: false },
    null,
  ] }, {}).counts.pendingScans,
  1,
  'pending diagnostics count must only include strict boolean pending markers'
);

assert.deepEqual(
  createDiagnosticsSnapshot({
    chantiers: { length: 99 },
    mat: 'not-an-array',
    scans: { 0: { _pending: true }, length: 1 },
    users: 7,
    chefChantierStats: {},
    prixCatalogue: 'not-an-array',
  }, { version: 150, online: 'yes' }),
  {
    version: '150',
    role: null,
    adminOwner: false,
    adminMode: false,
    page: null,
    online: null,
    counts: { chantiers: 0, materials: 0, scans: 0, pendingScans: 0, users: 0, chefChantierStats: 0 },
  },
  'diagnostics must ignore array-like or malformed collection values without false warnings'
);

function warningsFor(testState, runtime = { online: true }) {
  return createDiagnosticsSnapshot(testState, runtime).warnings || [];
}

const warningCases = [
  {
    warning: 'CHEF_CHANTIER_MATERIAL_SCOPE_LEAK',
    state: { role: 'chef_chantier', page: 'dashboard', mat: [{ id: 'M-SECRET' }] },
  },
  {
    warning: 'CHEF_CHANTIER_SCAN_SCOPE_LEAK',
    state: { role: 'chef_chantier', page: 'dashboard', scans: [{ id: 'S-SECRET' }] },
  },
  {
    warning: 'CHEF_CHANTIER_STATS_MISSING',
    state: { role: 'chef_chantier', page: 'dashboard', chantiers: [{ id: 'C-SECRET' }], chefChantierStats: [] },
  },
  {
    warning: 'CATALOGUE_SCOPE_LEAK',
    state: { role: 'agent', page: 'dashboard', prixCatalogue: [{ ref: 'PRICE-SECRET' }] },
  },
  {
    warning: 'OWNER_ADMIN_MODE_ROLE_MISMATCH',
    state: { role: 'chef', page: 'dashboard', isAdminOwner: true, __ownerAdminMode: true },
  },
  {
    warning: 'OWNER_ADMIN_MODE_WITHOUT_OWNER',
    state: { role: 'admin', page: 'dashboard', isAdminOwner: false, __ownerAdminMode: true },
  },
  {
    warning: 'OWNER_ADMIN_ROLE_OUTSIDE_MODE',
    state: { role: 'admin', page: 'dashboard', isAdminOwner: true, __ownerAdminMode: false },
  },
  {
    warning: 'SESSION_PAGE_WITHOUT_ROLE',
    state: { role: null, page: 'dashboard' },
  },
  {
    warning: 'SESSION_DATA_WITHOUT_ROLE',
    state: { role: null, page: 'login', chantiers: [{ id: 'C-SECRET' }] },
  },
];

for (const testCase of warningCases) {
  assert.equal(
    warningsFor(testCase.state).includes(testCase.warning),
    true,
    `diagnostics must emit ${testCase.warning} when its invariant is violated`
  );
}

assert.deepEqual(
  warningsFor({
    role: 'chef_chantier',
    page: 'dashboard',
    chantiers: [{ id: 'C-SECRET' }],
    mat: [],
    scans: [],
    chefChantierStats: [{ chantier_id: 'C-SECRET' }],
    prixCatalogue: [],
    isAdminOwner: false,
    __ownerAdminMode: false,
  }),
  [],
  'diagnostics must not warn on a normal scoped Chef de chantier state'
);

assert.deepEqual(
  warningsFor({
    role: 'chef_chantier',
    page: 'dashboard',
    chantiers: [{ id: 'C-SECRET' }],
    mat: [],
    scans: [],
    chefChantierStats: [],
  }, { online: false }),
  [],
  'offline Chef de chantier state must not report missing server statistics'
);

assert.deepEqual(
  warningsFor({
    role: 'chef_chantier',
    page: 'dashboard',
    chantiers: [{ id: 'C-SECRET' }],
    mat: [],
    scans: [],
    chefChantierStats: [],
  }, {}),
  [],
  'Chef de chantier state with unknown connectivity must not report missing server statistics'
);

console.log('PASS: v150B-2B diagnostics snapshot is metadata-only, pure and warning contracts are covered');