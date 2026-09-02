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

(async()=>{
  let baseCalls=0;
  const rpcCalls=[];
  let dialogConfig=null;
  const runtimeWorkbook={SheetNames:['INVENTAIRE'],Sheets:{INVENTAIRE:{rows}}};
  const runtimeXlsx={
    read:()=>runtimeWorkbook,
    write:()=>new ArrayBuffer(8),
    utils:{sheet_to_json:s=>s.rows,aoa_to_sheet:r=>({rows:r})}
  };
  const runtimeWin={
    XLSX:runtimeXlsx,
    S:{chantiers:[
      {id:'ROOT_A',nom:'CDG',statut:'actif',parent_id:null},
      {id:'ROOT_B',nom:'DPI 3053 LISON',statut:'actif',parent_id:null}
    ],mat:[]},
    RailOpsRegisterImportToleranceV155:{baseImport:async()=>{baseCalls++;return {legacy:true};}},
    RailOpsStructuredRegisterUI:{open:cfg=>{dialogConfig=cfg;}},
    db:{rpc:async(name,args)=>{rpcCalls.push({name,args});return {data:{targets:2,processed:3,createdTargets:2},error:null};}},
    toast:()=>{},
    console:{warn:()=>{},info:()=>{},error:()=>{}},
    File:function(){}
  };
  const api=core.createBrowserApi(runtimeWin);
  const fakeFile={name:'REGISTRE_DPI2455.xlsm',arrayBuffer:async()=>new ArrayBuffer(8)};
  const input={id:'importFile',files:[fakeFile],value:'x'};
  const result=await api.handleInput(input);
  assert.strictEqual(result?.handled,true,'structured register must be owned by v156');
  assert.strictEqual(baseCalls,0,'structured register must never fall back to legacy v145');
  assert(dialogConfig,'structured register mapping dialog must open');
  assert.strictEqual(dialogConfig.mode,'import');
  assert.deepStrictEqual(dialogConfig.groups.map(g=>[g.site,g.items.length]),[['Zone A',1],['Zone B',2]]);
  assert.deepStrictEqual(dialogConfig.masters.map(m=>m.id),['ROOT_A','ROOT_B']);

  await dialogConfig.onSubmit('ROOT_A');
  assert.strictEqual(rpcCalls.length,1,'one atomic RPC must own target creation and material import');
  assert.strictEqual(rpcCalls[0].name,'railops_apply_structured_register_admin');
  assert.strictEqual(rpcCalls[0].args.p_payload.mode,'import');
  assert.strictEqual(rpcCalls[0].args.p_payload.parentId,'ROOT_A');
  assert.strictEqual(rpcCalls[0].args.p_payload.targets.length,2);
  assert.strictEqual(rpcCalls[0].args.p_payload.targets[0].items[0].reference,'REF-001');
  assert.strictEqual(rpcCalls[0].args.p_payload.targets[1].items[0].reference,'REF-001');

  dialogConfig=null;rpcCalls.length=0;
  await api.handleInput({id:'replaceFile',files:[fakeFile],value:'x'});
  assert(dialogConfig,'replacement must use the same structured dialog');
  assert.strictEqual(dialogConfig.mode,'replace');
  await dialogConfig.onSubmit('ROOT_A');
  assert.strictEqual(rpcCalls[0].name,'railops_apply_structured_register_admin');
  assert.strictEqual(rpcCalls[0].args.p_payload.mode,'replace');

  console.log('PASS register import/replace business-reference semantics');
})().catch(err=>{console.error(err);process.exit(1);});
