const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const source=fs.readFileSync('js/core/lifecycle.js','utf8');

function makeContext({role='admin',session=true,failRpc=null}={}){
  let legacyLoadCalls=0,renders=0;
  const calls=[];const store=new Map([['ro3_a','stale'],['ro3_m','stale']]);
  const ctx={ok:true,id:'U1',nom:'Test User',badge:'B1',role,is_admin_owner:role==='admin'};
  const data={
    railops_session_context:ctx,
    railops_chantiers_scope:[{id:'C1'}],
    railops_materials_scope:[{id:'M1',chantierId:'C1'}],
    railops_scans_scope:[],
    railops_user_directory:[{id:'U1',nom:'Test User',badge:'B1',role,is_admin:role==='admin'}],
    railops_catalogue_scope:[{ref:'R1',prix:12}],
    railops_chef_chantier_tree_stats:[{chantier_id:'C1',total_materiels:1}]
  };
  const context={console,Map,Set,Promise,JSON,Array,String,TypeError,setTimeout,clearTimeout,
    localStorage:{setItem:(k,v)=>store.set(k,String(v)),getItem:k=>store.get(k)??null,removeItem:k=>store.delete(k)},
    S:{page:'login',agent:'Old',role:'old',users:[{mdp:'legacy'}],chantiers:[{}],mat:[{}],scans:[{}],prixCatalogue:[{}]},
    db:{
      auth:{getSession:async()=>({data:{session:session?{access_token:'t'}:null},error:null})},
      rpc:async name=>{calls.push(name);if(name===failRpc)return {data:null,error:new Error('RPC_FAIL')};return {data:data[name]??[],error:null};}
    },
    normMats:x=>x,document:{getElementById:()=>null,body:{}},MutationObserver:class{observe(){}},window:{}};
  context.window.render=()=>{renders++;};context.render=context.window.render;
  context.window.load=async()=>{legacyLoadCalls++;};context.load=context.window.load;
  vm.runInNewContext(source,context,{filename:'lifecycle.js'});
  return {context,calls,store,get legacyLoadCalls(){return legacyLoadCalls;},get renders(){return renders;}};
}

(async()=>{
  {
    const t=makeContext({role:'admin'});await t.context.window.load();
    assert(t.calls.includes('railops_catalogue_scope'),'admin must load catalogue through scoped RPC');
    assert.strictEqual(t.context.S.prixCatalogue.length,1);
    assert.strictEqual(t.legacyLoadCalls,0);
  }
  {
    const t=makeContext({role:'chef'});await t.context.window.load();
    assert(t.calls.includes('railops_catalogue_scope'),'chef must load catalogue through scoped RPC');
    assert.strictEqual(t.context.S.prixCatalogue.length,1);
  }
  {
    const t=makeContext({role:'chef_chantier'});await t.context.window.load();
    assert(t.calls.includes('railops_chef_chantier_tree_stats'),'chef_chantier must load scoped tree stats');
    assert(!t.calls.includes('railops_catalogue_scope'),'chef_chantier must not load privileged catalogue');
    assert.strictEqual(t.context.S.chefChantierStats.length,1);
  }
  {
    const t=makeContext({role:'agent',session:false});await t.context.window.load();
    assert.strictEqual(t.legacyLoadCalls,0,'missing auth session must never fall back to legacy load');
    assert.strictEqual(t.context.S.page,'login');
    assert.strictEqual(t.context.S.agent,null);
    assert.strictEqual(t.context.S.mat.length,0);
    assert(!t.store.has('ro3_a'),'stale authenticated cache must be removed');
    assert.strictEqual(t.store.get('ro3_m'),'stale','operational cache must survive a missing session for offline recovery');
  }
  {
    const t=makeContext({role:'agent',failRpc:'railops_materials_scope'});
    let failed=false;try{await t.context.window.load();}catch(e){failed=true;assert.match(String(e),/RPC_FAIL/);}
    assert(failed,'RPC failure must be surfaced');
    assert.strictEqual(t.legacyLoadCalls,0,'RPC failure must never fall back to direct tables');
  }
  console.log('secure session role/error regressions: OK');
})().catch(e=>{console.error(e);process.exit(1);});
