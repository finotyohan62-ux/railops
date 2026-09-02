const assert=require('assert');
const core=require('../js/core/register-import-v156.js');

const rows=[
  ['4 articles'],
  ['Nom Chantier','Référence','Désignation','Catégorie','Échéance'],
  ['Zone A','REF-001','Perche A','Outillage','01/01/2027'],
  ['Zone A','REF-001','Perche A doublon','Outillage','01/01/2027'],
  ['Zone B','REF-001','Perche B','Outillage','02/01/2027'],
  ['Zone B','REF-002','VAT B','Mesure','03/01/2027']
];
const normalized=core.normalizeStructuredRows(rows);
assert.strictEqual(normalized.kind,'normalized');
assert.strictEqual(normalized.duplicateRows.length,1,'same chantier/reference must be deduplicated');
assert.strictEqual(normalized.crossSiteDuplicate.length,1,'same business reference across sites must remain legitimate');
assert.strictEqual(normalized.crossSiteDuplicate[0].ref,'REF-001');

const XLSX={utils:{sheet_to_json:s=>s.rows,aoa_to_sheet:r=>({rows:r})}};
const wb={SheetNames:['Registre'],Sheets:{Registre:{rows}}};
core.normalizeWorkbook(wb,XLSX);
const parsed=core.structuredGroupsFromWorkbook(wb,XLSX);
assert.strictEqual(parsed.groups.length,2);
assert.strictEqual(parsed.crossSiteReferences.length,1);
assert.deepStrictEqual(parsed.groups.map(g=>[g.site,g.items.length]),[['Zone A',1],['Zone B',2]]);

const win={S:{chantiers:[
  {id:'CH_A',nom:'Zone A',statut:'actif'},
  {id:'CH_B',nom:'Zone B',statut:'actif'}
]}};
const mapping=core.resolveExistingTargets(parsed.groups,win);
assert.strictEqual(mapping.ok,true);
const payload=core.buildPayload(mapping.resolved);
assert.strictEqual(payload.targets.length,2);
assert.strictEqual(payload.targets[0].items[0].reference,'REF-001');
assert.strictEqual(payload.targets[1].items[0].reference,'REF-001');

const fs=require('fs');
const source=fs.readFileSync(require.resolve('../js/core/register-import-v156.js'),'utf8');
assert(source.includes("input?.id==='replaceFile'"),'replace picker must use its dedicated path');
assert(source.includes('railops_replace_material_register_admin'),'replacement must use the atomic replace RPC');
assert(source.includes('railops_import_material_register_admin'),'multi-chantier import must use the atomic batch import RPC');
console.log('PASS register import/replace business-reference semantics');
