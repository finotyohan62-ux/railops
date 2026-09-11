const assert=require('assert');
const core=require('../js/core/register-import-v156.js');

function runtimeFor(workbook){
  let baseCalls=0,dialogConfig=null;
  const rpcCalls=[];
  const XLSX={
    read:()=>workbook,
    utils:{
      sheet_to_json:sheet=>sheet.rows,
      aoa_to_sheet:rows=>({rows})
    }
  };
  const win={
    XLSX,
    S:{chantiers:[{id:'ROOT',nom:'CHANTIER MAITRE',statut:'actif',parent_id:null}],mat:[]},
    RailOpsRegisterImportToleranceV155:{baseImport:async()=>{baseCalls++;return {legacy:true};}},
    RailOpsStructuredRegisterUI:{open:cfg=>{dialogConfig=cfg;}},
    db:{rpc:async(name,args)=>{rpcCalls.push({name,args});return {data:{targets:2,processed:3,createdTargets:2},error:null};}},
    toast:()=>{},console:{warn:()=>{},info:()=>{},error:()=>{}},File:function(){},
    document:{createElement:()=>({}),head:{appendChild:()=>{}}}
  };
  return {win,get baseCalls(){return baseCalls;},get dialog(){return dialogConfig;},rpcCalls};
}
function file(name='REGISTRE.xlsx'){return {name,arrayBuffer:async()=>new ArrayBuffer(8)};}

(async()=>{
  {
    const workbook={SheetNames:['VEMARS','LISON'],Sheets:{
      VEMARS:{rows:[['Référence','Désignation'],['V-001','VAT'],['V-002','Perche']]},
      LISON:{rows:[['Référence','Désignation'],['L-001','Pulsar']]}
    }};
    const rt=runtimeFor(workbook);
    const api=core.createBrowserApi(rt.win);
    const result=await api.handleInput({id:'importFile',files:[file()],value:'x'});
    assert.strictEqual(result?.handled,true,'sheet-per-site register must be owned by v156 adaptive path');
    assert.strictEqual(rt.baseCalls,0,'sheet-per-site register must not fall back to legacy import');
    assert(rt.dialog,'sheet-per-site register must open the structured dialog');
    assert.strictEqual(rt.dialog.adaptiveFormat,'sheet-per-site');
    assert.deepStrictEqual(rt.dialog.groups.map(g=>[g.site,g.items.length]),[['VEMARS',2],['LISON',1]]);
  }

  {
    const workbook={SheetNames:['REGISTRE CHEF'],Sheets:{'REGISTRE CHEF':{rows:[
      ['CHANTIER : VEMARS'],['Référence','Désignation'],['V-001','VAT'],[],
      ['ZONE : LISON'],['Référence','Désignation'],['L-001','Pulsar']
    ]}}};
    const rt=runtimeFor(workbook);
    const api=core.createBrowserApi(rt.win);
    await api.handleInput({id:'replaceFile',files:[file('BLOCS.xlsx')],value:'x'});
    assert(rt.dialog,'block-per-site register must open the structured dialog');
    assert.strictEqual(rt.dialog.mode,'replace');
    assert.strictEqual(rt.dialog.adaptiveFormat,'block-per-site');
    assert.deepStrictEqual(rt.dialog.groups.map(g=>g.site),['VEMARS','LISON']);
  }

  {
    const workbook={SheetNames:['Feuil1'],Sheets:{Feuil1:{rows:[
      ['Référence','Désignation'],['S-001','VAT'],['S-002','Perche']
    ]}}};
    const rt=runtimeFor(workbook);
    const api=core.createBrowserApi(rt.win);
    const result=await api.handleInput({id:'importFile',files:[file('SIMPLE.xlsx')],value:'x'});
    assert.strictEqual(rt.baseCalls,1,'single-site register must keep the historical simple import flow');
    assert.strictEqual(rt.dialog,null,'single-site register must not invent a structured destination');
    assert.deepStrictEqual(result,{legacy:true});
  }

  console.log('PASS: v156 adaptive register integration contract');
})().catch(err=>{console.error(err);process.exit(1);});
