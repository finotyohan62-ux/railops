const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const source=fs.readFileSync('js/core/lifecycle.js','utf8');
let legacyLoadCalls=0;
let renders=0;
const rpcCalls=[];
const store=new Map();
const rows={
  railops_session_context:{ok:true,id:'U1',nom:'Agent Test',badge:'B1',role:'agent',is_admin_owner:false},
  railops_chantiers_scope:[{id:'C1',nom:'Chantier 1',agents:['Agent Test']}],
  railops_materials_scope:[{id:'M1',nom:'Matériel 1',chantierId:'C1'}],
  railops_scans_scope:[{id:'S1',materielId:'M1',chantierId:'C1'}],
  railops_user_directory:[{id:'U1',nom:'Agent Test',badge:'B1',role:'agent',is_admin:false}]
};

const context={
  console,
  Map,Set,Promise,JSON,Array,String,TypeError,
  setTimeout,clearTimeout,
  navigator:{onLine:true},
  localStorage:{
    setItem:(k,v)=>store.set(k,String(v)),
    getItem:k=>store.has(k)?store.get(k):null,
    removeItem:k=>store.delete(k)
  },
  S:{page:'login',agent:null,role:null,chantiers:[],mat:[],scans:[],users:[],prixCatalogue:[]},
  db:{
    auth:{getSession:async()=>({data:{session:{access_token:'token'}},error:null})},
    rpc:async(name,args)=>{rpcCalls.push(name);return {data:rows[name]??[],error:null};}
  },
  normMats:x=>x,
  document:{getElementById:()=>null,body:{}},
  MutationObserver:class{observe(){}},
  window:{}
};
context.window.render=()=>{renders++;};
context.render=context.window.render;
context.window.load=async()=>{legacyLoadCalls++;};
context.load=context.window.load;

vm.runInNewContext(source,context,{filename:'lifecycle.js'});

(async()=>{
  let afterLoadCalls=0;
  context.window.RailOpsLifecycleV155.afterLoad('test-secure',()=>{afterLoadCalls++;});
  await context.window.load();

  assert.strictEqual(legacyLoadCalls,0,'secure load must not call the legacy table loader');
  assert.deepStrictEqual(rpcCalls.slice().sort(),[
    'railops_chantiers_scope','railops_materials_scope','railops_scans_scope','railops_session_context','railops_user_directory'
  ].sort(),'secure load must use the scoped RPC set');
  assert.strictEqual(context.S.agent,'Agent Test');
  assert.strictEqual(context.S.role,'agent');
  assert.strictEqual(context.S.page,'dashboard');
  assert.strictEqual(context.S.chantiers.length,1);
  assert.strictEqual(context.S.mat.length,1);
  assert.strictEqual(context.S.scans.length,1);
  assert.strictEqual(context.S.users.length,1);
  assert.strictEqual(context.S.users[0].mdp,undefined,'password material must never enter client state');
  assert.strictEqual(afterLoadCalls,1,'shared lifecycle afterLoad hooks must still run');
  assert.ok(renders>=1,'load must preserve rendering behavior');
  assert.ok(store.has('ro3_a'),'authenticated identity cache must be refreshed');
  assert.ok(!source.includes("db.from('users')"),'secure lifecycle must not read users directly');
  assert.ok(!source.includes('flushOfflineQueue'),'security wiring must not override offline sync');
  console.log('secure session load regression: OK');
})().catch(err=>{console.error(err);process.exit(1);});
