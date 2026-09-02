const core=require('../js/core/register-import-v156.js');
function fail(m){console.error('FAIL:',m);process.exit(1)}
if(typeof core.reconcileStructuredSources!=='function')fail('v156 does not expose structured/site-sheet reconciliation');

const inventory=[
  ['INVENTAIRE COMPLET'],
  ['Référence','Désignation','Numéro','Qté','Site','Catégorie','Validité'],
  ['V-001','VAT 1','','1','VEMARS','VAT','01/12/2026'],
  ['V-002','VAT 2','','1','VEMARS','VAT','01/12/2026'],
  ['X-999','Déjà déplacé','','1','ROISSY','VAT','01/12/2026']
];
const vemars=[
  ['SITE : VEMARS -- 98 article(s)'],
  ['Référence','Désignation','Numéro','Catégorie','Validité','Statut'],
  ['V-001','VAT 1','V-001','VAT','01/12/2026','Valide'],
  ['V-002','VAT 2','V-002','VAT','01/12/2026','Valide'],
  ['V-003','VAT 3','V-003','VAT','02/12/2026','Valide'],
  ['V-004','VAT 4','V-004','VAT','03/12/2026','Valide'],
  ['X-999','Ancienne affectation','X-999','VAT','04/12/2026','Valide']
];
const container=[
  ['CONTAINER-01 -- 55 article(s)'],
  ['Référence','Désignation','Numéro','Catégorie','Validité','Statut'],
  ['C-001','Perche 1','C-001','Perche','05/12/2026','Valide']
];

const result=core.reconcileStructuredSources([
  {name:'INVENTAIRE',rows:inventory},
  {name:'VEMARS',rows:vemars},
  {name:'CONTAINER',rows:container}
]);

if(!result||!Array.isArray(result.sheets))fail('reconciliation returned no sheet model');
const inv=result.sheets.find(s=>s.name==='INVENTAIRE');
if(!inv)fail('INVENTAIRE disappeared during reconciliation');
const rows=inv.rows;
const header=rows[1];
const refCol=header.indexOf('Référence');
const siteCol=header.indexOf('Site');
const refsBySite=new Map();
for(const row of rows.slice(2)){
  const ref=String(row[refCol]||'').trim().toUpperCase();
  const site=String(row[siteCol]||'').trim().toUpperCase();
  if(!ref||!site)continue;
  const k=site+'|'+ref;
  refsBySite.set(k,(refsBySite.get(k)||0)+1);
}
for(const ref of ['V-001','V-002','V-003','V-004'])if(refsBySite.get('VEMARS|'+ref)!==1)fail('VEMARS did not retain/supplement '+ref+' exactly once');
if(refsBySite.has('VEMARS|X-999'))fail('a reference already assigned elsewhere in INVENTAIRE was incorrectly duplicated into VEMARS');
if(refsBySite.get('ROISSY|X-999')!==1)fail('existing structured assignment was not preserved');
if(refsBySite.get('CONTAINER-01|C-001')!==1)fail('site title alias CONTAINER -> CONTAINER-01 was not reconciled');
if(result.added!==3)fail('expected exactly 3 missing site-sheet references to be supplemented, got '+result.added);
if(result.conflicts!==1)fail('expected exactly 1 cross-source assignment conflict, got '+result.conflicts);

console.log('PASS: structured INVENTAIRE is safely supplemented from coherent per-site sheets');
