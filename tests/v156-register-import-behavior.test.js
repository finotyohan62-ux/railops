const assert = require('node:assert/strict');
const { normalizeStructuredRows } = require('../js/core/register-import-v156.js');

function makeDpi2455Rows(){
  const rows=[
    ['INVENTAIRE COMPLET — DPI2455 — 548 articles'],
    ['Référence','Désignation','Site']
  ];
  const buckets=[
    ['RETOUR',340],
    ['CONTAINER-01',247],
    ['ROISSY',117],
    ['VEMARS',31]
  ];
  let n=1;
  for(const [site,count] of buckets){
    for(let i=0;i<count;i++){
      const ref=`REF-${String(n).padStart(4,'0')}`;
      rows.push([ref,`Matériel ${n}`,site]);
      n++;
    }
  }
  // Two recoverable duplicates in the same site: 737 data rows, 735 unique pairs.
  rows.push(['REF-0588','Doublon ROISSY 1','ROISSY']);
  rows.push(['REF-0589','Doublon ROISSY 2','ROISSY']);
  return rows;
}

const dpiRows=makeDpi2455Rows();
assert.equal(dpiRows.length-2,737,'fixture must contain 737 data rows');
const normalized=normalizeStructuredRows(dpiRows);
assert.equal(normalized.kind,'normalized');
assert.equal(normalized.uniqueCount,735);
assert.equal(normalized.duplicateRows.length,2);
assert.equal(normalized.declaredMismatch,true);
assert.equal(normalized.crossSiteDuplicate.length,0);
assert.match(normalized.rows[0][0],/735 articles/);
assert.equal(normalized.rows.length-2,735);

const counts=new Map();
for(const row of normalized.rows.slice(2))counts.set(row[2],(counts.get(row[2])||0)+1);
assert.deepEqual(Object.fromEntries(counts),{
  'RETOUR':340,
  'CONTAINER-01':247,
  'ROISSY':117,
  'VEMARS':31
});

const ambiguousRows=[
  ['INVENTAIRE — 2 articles'],
  ['Référence','Site'],
  ['AA20M-3730','ROISSY'],
  ['AA20M-3730','VEMARS']
];
const ambiguous=normalizeStructuredRows(ambiguousRows);
assert.equal(ambiguous.kind,'ambiguous');
assert.equal(ambiguous.crossSiteDuplicate.length,1);
assert.equal(ambiguous.rows,ambiguousRows,'ambiguous input must not be rewritten');

console.log('PASS: DPI2455-shaped register normalizes to 735 unique references and cross-site ambiguity stays blocking');
