const assert=require('assert');
const core=require('../js/core/register-import-v156.js');

const rows=[
  ['4 articles'],
  ['Nom Chantier','Référence','Désignation','Catégorie','Échéance'],
  ['Molay-Litry','DRAPEAUX-01','Kit drapeaux','Signalisation',''],
  ['','PULSAR170','Pulsar170','Signalisation',''],
  ['','PULSAR179','Pulsar179','Signalisation',''],
  ['','PULSAR180','Pulsar180','Signalisation','']
];

const normalized=core.normalizeStructuredRows(rows);
assert.strictEqual(normalized.uniqueCount,4,'continuation rows under a merged site cell must count as materials');
assert.strictEqual(normalized.declaredMismatch,false,'the declared total must stay correct when the site cell is visually merged');

const XLSX={utils:{sheet_to_json:s=>s.rows,aoa_to_sheet:r=>({rows:r})}};
const wb={SheetNames:['Registre'],Sheets:{Registre:{rows}}};
const parsed=core.structuredGroupsFromWorkbook(wb,XLSX);

assert.strictEqual(parsed.groups.length,1,'all continuation rows must remain in the same site group');
assert.strictEqual(parsed.groups[0].site,'Molay-Litry');
assert.deepStrictEqual(
  parsed.groups[0].items.map(item=>item.reference),
  ['DRAPEAUX-01','PULSAR170','PULSAR179','PULSAR180'],
  'materials following a merged site cell must not be dropped during import/replace'
);

console.log('PASS merged site cells keep every material in the structured register');
