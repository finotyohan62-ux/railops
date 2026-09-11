const core=require('../js/core/register-import-v156.js');

function fail(message){console.error('FAIL:',message);process.exit(1)}
function assert(condition,message){if(!condition)fail(message)}

assert(typeof core.reconcileStructuredSources==='function','v156 must expose reconcileStructuredSources');

function indexByHeader(row,label){return row.findIndex(v=>String(v||'').trim().toUpperCase()===label.toUpperCase());}
function inventoryPairs(result){
  const inv=result.sheets.find(s=>String(s.name).toUpperCase()==='INVENTAIRE');
  assert(inv,'INVENTAIRE must remain present');
  const headerIndex=inv.rows.findIndex(row=>Array.isArray(row)&&row.some(v=>String(v||'').trim().toUpperCase()==='RÉFÉRENCE'));
  assert(headerIndex>=0,'INVENTAIRE header row missing');
  const header=inv.rows[headerIndex];
  const refCol=indexByHeader(header,'Référence');
  const siteCol=indexByHeader(header,'Site');
  assert(refCol>=0&&siteCol>=0,'INVENTAIRE reference/site columns missing');
  return inv.rows.slice(headerIndex+1).map(row=>({
    ref:String(row[refCol]||'').trim().toUpperCase(),
    site:String(row[siteCol]||'').trim().toUpperCase()
  })).filter(x=>x.ref&&x.site);
}

(function supplementsMissingReferencesWithoutMovingExplicitAssignments(){
  const result=core.reconcileStructuredSources([
    {name:'INVENTAIRE',rows:[
      ['INVENTAIRE COMPLET'],
      ['Référence','Désignation','Numéro','Qté','Site','Catégorie','Validité'],
      ['V-001','VAT 1','','1','VEMARS','VAT','01/12/2026'],
      ['V-002','VAT 2','','1','VEMARS','VAT','01/12/2026'],
      ['X-999','Déjà affecté','','1','ROISSY','VAT','01/12/2026']
    ]},
    {name:'VEMARS',rows:[
      ['SITE : VEMARS -- 5 matériels'],
      ['Référence','Désignation','Numéro','Catégorie','Validité','Statut'],
      ['V-001','VAT 1','V-001','VAT','01/12/2026','Valide'],
      ['V-002','VAT 2','V-002','VAT','01/12/2026','Valide'],
      ['V-003','VAT 3','V-003','VAT','02/12/2026','Valide'],
      ['V-004','VAT 4','V-004','VAT','03/12/2026','Valide'],
      ['X-999','Ancienne affectation','X-999','VAT','04/12/2026','Valide']
    ]},
    {name:'CONTAINER',rows:[
      ['CONTAINER-01 -- 1 matériel'],
      ['Référence','Désignation','Numéro','Catégorie','Validité','Statut'],
      ['C-001','Perche 1','C-001','Perche','05/12/2026','Valide']
    ]}
  ]);

  const pairs=inventoryPairs(result);
  const count=(site,ref)=>pairs.filter(x=>x.site===site&&x.ref===ref).length;
  for(const ref of ['V-001','V-002','V-003','V-004'])assert(count('VEMARS',ref)===1,`VEMARS must contain ${ref} exactly once`);
  assert(count('ROISSY','X-999')===1,'explicit INVENTAIRE assignment for X-999 must be preserved');
  assert(count('VEMARS','X-999')===0,'conflicting site sheet must not move or duplicate X-999');
  assert(count('CONTAINER-01','C-001')===1,'sheet title must resolve CONTAINER-01 and supplement C-001');
  assert(result.added===3,`expected 3 safely supplemented references, got ${result.added}`);
  assert(result.conflictRefs.includes('X-999'),'X-999 must be reported as a conflict');
  assert(!result.blockingConflictRefs.includes('X-999'),'explicit INVENTAIRE assignment must remain authoritative, not blocking');
})();

(function refusesToGuessWhenMissingReferenceAppearsOnMultipleSites(){
  const result=core.reconcileStructuredSources([
    {name:'INVENTAIRE',rows:[
      ['Référence','Désignation','Site'],
      ['A-001','Existing','LISON']
    ]},
    {name:'VEMARS',rows:[
      ['Référence','Désignation'],
      ['AMB-001','Ambiguous item']
    ]},
    {name:'ROISSY',rows:[
      ['Référence','Désignation'],
      ['AMB-001','Ambiguous item']
    ]}
  ]);
  const pairs=inventoryPairs(result);
  assert(!pairs.some(x=>x.ref==='AMB-001'),'ambiguous reference must not be auto-assigned');
  assert(result.conflictRefs.includes('AMB-001'),'ambiguous reference must be surfaced as conflict');
  assert(result.blockingConflictRefs.includes('AMB-001'),'ambiguous reference with no authoritative assignment must block import');
})();

console.log('PASS: multi-chantier source reconciliation contract');
