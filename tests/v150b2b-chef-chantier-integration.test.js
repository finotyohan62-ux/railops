const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { installChefChantierStatsAdapter } = require('../v150b2b-chef-chantier-stats.js');

const loader = fs.readFileSync(path.join(__dirname, '..', 'v150b2b-loader.js'), 'utf8');
assert.match(
  loader,
  /railops_chef_chantier_tree_stats/,
  'secure loader must request the stats-only RPC for Chef de chantier'
);
assert.match(
  loader,
  /S\.chefChantierStats\s*=/,
  'secure loader must store the stats-only rows without material references'
);

const state = {
  agent: 'Chef chantier test',
  role: 'chef_chantier',
  page: 'dashboard',
  curC: null,
  chantiers: [
    { id: 'MASTER', nom: 'Maître', lieu: 'Zone A', chef: 'Chef A', statut: 'actif', parent_id: null },
    { id: 'CHILD', nom: 'Sous-chantier', lieu: 'Zone B', chef: 'Chef A', statut: 'actif', parent_id: 'MASTER' },
  ],
  chefChantierStats: [
    { chantier_id: 'MASTER', total_materiels: 10, verif_1_ok: 7, verif_2_ok: 4 },
    { chantier_id: 'CHILD', total_materiels: 5, verif_1_ok: 5, verif_2_ok: 3 },
  ],
};
const root = { innerHTML: '' };
const target = {
  st: () => state,
  isCC: () => true,
  descendants: () => ['MASTER', 'CHILD'],
  statsFor: () => ({ total: 0, v1: 0, v2: 0 }),
  pgDash: r => { r.innerHTML = 'LEGACY_ZERO_DASHBOARD'; },
  pgChantiers: r => { r.innerHTML = 'LEGACY_ZERO_CHANTIERS'; },
  renderChantierDetail: () => { root.innerHTML = 'LEGACY_ZERO_DETAIL'; },
  document: { getElementById: id => id === 'app' ? root : null },
  RailOpsRole148: { open() {} },
};

assert.equal(installChefChantierStatsAdapter(target), true);
target.pgDash(root);
assert.doesNotMatch(root.innerHTML, /LEGACY_ZERO_DASHBOARD/, 'Chef chantier dashboard must bypass the legacy S.mat-based renderer');
assert.match(root.innerHTML, /15 suivis/, 'master card must aggregate master + descendant stats from server rows');
assert.match(root.innerHTML, /12\/15/, 'verification 1 count must use server aggregates');
assert.match(root.innerHTML, /7\/15/, 'verification 2 count must use server aggregates');

console.log('v150b2b Chef chantier secure stats integration: OK');
