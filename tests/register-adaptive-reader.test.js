const assert=require('assert');
const reader=require('../js/core/register-adaptive-reader.js');

function bySite(model,site){return model.groups.find(g=>g.siteKey===reader.siteKey(site));}
function refs(group){return (group?.items||[]).map(x=>x.reference);}

assert.strictEqual(typeof reader.detectAndParseWorkbook,'function','adaptive reader must expose detectAndParseWorkbook');
assert.strictEqual(typeof reader.parseSheetRows,'function','adaptive reader must expose parseSheetRows');

(function structuredMultiSiteKeepsMergedContinuationAndRealMulti(){
  const model=reader.detectAndParseWorkbook([{name:'Registre',rows:[
    ['Nom Chantier','Référence','Désignation','Catégorie','Échéance'],
    ['VEMARS','REF-001','Perche A','Outillage','01/01/2027'],
    ['','REF-002','VAT A','Mesure','02/01/2027'],
    ['LISON','REF-001','Perche B','Outillage','03/01/2027']
  ]}]);
  assert.strictEqual(model.format,'structured-table');
  assert(model.confidence>=0.9,'structured table must be high confidence');
  assert.deepStrictEqual(refs(bySite(model,'VEMARS')),['REF-001','REF-002']);
  assert.deepStrictEqual(refs(bySite(model,'LISON')),['REF-001']);
})();

(function inventoryAndSiteSheetsAreReconciledSafely(){
  const model=reader.detectAndParseWorkbook([
    {name:'INVENTAIRE',rows:[
      ['Référence','Désignation','Site','Catégorie'],
      ['A-001','VAT 1','VEMARS','VAT'],
      ['X-999','Affectation explicite','ROISSY','VAT']
    ]},
    {name:'VEMARS',rows:[
      ['Référence','Désignation','Catégorie'],
      ['A-001','VAT 1','VAT'],
      ['A-002','VAT 2','VAT'],
      ['X-999','Ancienne affectation','VAT']
    ]},
    {name:'ROISSY',rows:[
      ['Référence','Désignation','Catégorie'],
      ['R-001','Perche','Perche']
    ]}
  ]);
  assert.strictEqual(model.format,'inventory-site-sheets');
  assert.deepStrictEqual(refs(bySite(model,'VEMARS')),['A-001','A-002']);
  assert.deepStrictEqual(refs(bySite(model,'ROISSY')),['X-999','R-001']);
  assert(model.conflicts.some(c=>c.reference==='X-999'),'conflicting secondary assignment must be reported');
  assert(!model.blockingConflicts.some(c=>c.reference==='X-999'),'explicit INVENTAIRE assignment must remain authoritative');
})();

(function oneSheetPerSiteIgnoresMetadataTabs(){
  const model=reader.detectAndParseWorkbook([
    {name:'VEMARS',rows:[['Référence','Désignation'],['V-001','VAT'],['V-002','Perche']]},
    {name:'LISON',rows:[['Référence','Désignation'],['L-001','Pulsar']]},
    {name:'AUDIT',rows:[['Référence','Désignation'],['SHOULD-NOT','Audit row']]}
  ]);
  assert.strictEqual(model.format,'sheet-per-site');
  assert.deepStrictEqual(model.groups.map(g=>g.site).sort(),['LISON','VEMARS']);
  assert.deepStrictEqual(refs(bySite(model,'VEMARS')),['V-001','V-002']);
  assert(!model.groups.some(g=>g.siteKey===reader.siteKey('AUDIT')),'metadata tabs must never become sites');
})();

(function multipleBlocksInOneSheetBecomeSeparateSites(){
  const model=reader.detectAndParseWorkbook([{name:'REGISTRE CHEF',rows:[
    ['CHANTIER : VEMARS'],
    ['Référence','Désignation','Catégorie'],
    ['V-001','VAT','VAT'],
    ['V-002','Perche','Perche'],
    [],
    ['ZONE : LISON'],
    ['Référence','Désignation','Catégorie'],
    ['L-001','Pulsar','Signalisation']
  ]}]);
  assert.strictEqual(model.format,'block-per-site');
  assert.deepStrictEqual(refs(bySite(model,'VEMARS')),['V-001','V-002']);
  assert.deepStrictEqual(refs(bySite(model,'LISON')),['L-001']);
})();

(function repeatedPlainSiteTitlesBeforeHeadersBecomeBlocks(){
  const model=reader.detectAndParseWorkbook([{name:'REGISTRE CHEF',rows:[
    ['VEMARS'],
    ['Référence','Désignation','Catégorie'],
    ['V-101','VAT','VAT'],
    ['V-102','Perche','Perche'],
    [],
    ['LISON'],
    ['Référence','Désignation','Catégorie'],
    ['L-101','Pulsar','Signalisation']
  ]}]);
  assert.strictEqual(model.format,'block-per-site','repeated plain site titles immediately before tables must be recognized as blocks');
  assert.deepStrictEqual(refs(bySite(model,'VEMARS')),['V-101','V-102']);
  assert.deepStrictEqual(refs(bySite(model,'LISON')),['L-101']);
})();

(function singleSheetStaysSingleAndDoesNotInventSite(){
  const model=reader.detectAndParseWorkbook([{name:'Feuil1',rows:[
    ['Référence','Désignation','Catégorie'],
    ['S-001','VAT','VAT'],
    ['S-002','Perche','Perche']
  ]}]);
  assert.strictEqual(model.format,'single-sheet');
  assert.strictEqual(model.groups.length,1);
  assert.strictEqual(model.groups[0].site,'');
  assert.deepStrictEqual(refs(model.groups[0]),['S-001','S-002']);
})();

(function ambiguousMissingReferenceBlocksInventoryReconciliation(){
  const model=reader.detectAndParseWorkbook([
    {name:'INVENTAIRE',rows:[['Référence','Désignation','Site'],['A-001','Known','LISON']]},
    {name:'VEMARS',rows:[['Référence','Désignation'],['AMB-001','Same item']]},
    {name:'ROISSY',rows:[['Référence','Désignation'],['AMB-001','Same item']]}
  ]);
  assert.strictEqual(model.format,'inventory-site-sheets');
  assert(model.blockingConflicts.some(c=>c.reference==='AMB-001'),'unassigned reference present on multiple sites must block');
  assert(!model.groups.some(g=>g.items.some(x=>x.reference==='AMB-001')),'ambiguous reference must not be assigned');
})();

console.log('PASS: adaptive register reader contract');
