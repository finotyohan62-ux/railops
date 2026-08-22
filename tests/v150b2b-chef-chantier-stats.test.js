const assert = require('node:assert/strict');
const { aggregateChefChantierStats, installChefChantierStatsAdapter } = require('../v150b2b-chef-chantier-stats.js');

const rows = [
  { chantier_id: 'MASTER', total_materiels: 10, verif_1_ok: 7, verif_2_ok: 4 },
  { chantier_id: 'CHILD', total_materiels: '5', verif_1_ok: '5', verif_2_ok: '3' },
  { chantier_id: 'OTHER', total_materiels: 99, verif_1_ok: 99, verif_2_ok: 99 },
];

assert.deepEqual(
  aggregateChefChantierStats(rows, ['MASTER', 'CHILD']),
  { total: 15, v1: 12, v2: 7 },
  'master stats must aggregate its descendants without leaking unrelated chantier rows'
);

{
  const target = {
    statsFor: () => ({ total: 999, v1: 999, v2: 999 }),
    isCC: () => true,
    st: () => ({ chefChantierStats: rows }),
    descendants: () => ['MASTER', 'CHILD'],
  };
  assert.equal(installChefChantierStatsAdapter(target), true);
  assert.deepEqual(target.statsFor({ id: 'MASTER' }), { total: 15, v1: 12, v2: 7 });
}

{
  const expected = { total: 2, v1: 1, v2: 1 };
  const target = {
    statsFor: () => expected,
    isCC: () => false,
    st: () => ({ chefChantierStats: rows }),
    descendants: () => ['MASTER', 'CHILD'],
  };
  installChefChantierStatsAdapter(target);
  assert.equal(target.statsFor({ id: 'MASTER' }), expected, 'non Chef de chantier behavior must remain unchanged');
}

console.log('v150b2b chef chantier stats adapter: OK');
