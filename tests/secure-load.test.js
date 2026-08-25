const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync(process.argv[2]||'js/core/lifecycle.js','utf8');

function makeContext({session=true,role='agent'}={}){
  const calls=[];
  let legacyLoadCalls=0;
  let afterLoadCalls=0;
  const storage=new Map();
  const ctx={
    console:{info(){},warn(){},error(){}},
    Map,Promise,Array,Object,String,TypeError,JSON,
    setTimeout(fn){ calls.push(['timeout',fn]); return 1; },
    clearTimeout(){},
    MutationObserver:class{observe(){}},
    document:{getElementById(){return {};},body:{}},
    localStorage:{
      setItem(k,v){storage.set(k,String(v));},
      getItem(k){return storage.get(k)||null;},
      removeItem(k){storage.delete(k);}
    },
    S:{agent:'Legacy Agent',role:'agent',page:'dashboard',users:[{id:'legacy'}],mat:[],scans:[],chantiers:[]},
    normMats(x){return x.map(v=>({...v,normalized:true}));},
    setupRealtime(){},
  };
  const rpcData={
    railops_session_context:{ok:true,nom:'Agent Test',role,is_admin_owner:false},
    railops_chantiers_scope:[{id:'c1',nom:'Chantier'}],
    railops_materials_scope:[{id:'m1',chantierId:'c1'}],
    railops_scans_scope:[{id:'s1',materielId:'m1',chantierId:'c1'}],
    railops_user_directory:[{id:'u1',nom:'Agent Test',badge:'B1',role,is_admin:false}],
    railops_chef_chantier_tree_stats:[{chantier_id:'c1',total_materiels:1}],
    railops_catalogue_scope:[{ref:'m1',prix:12}]
  };
  ctx.db={
    auth:{
      async getSession(){calls.push(['getSession']);return {data:{session:session?{access_token:'tok'}:null}};}
    },
    async rpc(name){calls.push(['rpc',name]);return {data:rpcData[name],error:null};},
    from(){throw new Error('direct table access forbidden in secure load');}
  };
  ctx.window=ctx;
  ctx.load=async()=>{legacyLoadCalls++;};
  ctx.window.load=ctx.load;
  ctx.render=()=>{};
  ctx.window.render=ctx.render;
  vm.createContext(ctx);
  vm.runInContext(source,ctx,{filename:'lifecycle.js'});
  ctx.window.RailOpsLifecycleV155.afterLoad('test',()=>{afterLoadCalls++;});
  return {ctx,calls,storage,get legacyLoadCalls(){return legacyLoadCalls;},get afterLoadCalls(){return afterLoadCalls;}};
}

(async()=>{
  {
    const h=makeContext({session:true,role:'agent'});
    await h.ctx.window.load();
    assert.equal(h.legacyLoadCalls,0,'authenticated load must not call legacy direct-table loader');
    const rpcNames=h.calls.filter(x=>x[0]==='rpc').map(x=>x[1]);
    for(const name of ['railops_session_context','railops_chantiers_scope','railops_materials_scope','railops_scans_scope','railops_user_directory']){
      assert.ok(rpcNames.includes(name),`secure load must call ${name}`);
    }
    assert.equal(h.ctx.S.agent,'Agent Test');
    assert.equal(h.ctx.S.mat[0].normalized,true);
    assert.deepEqual(JSON.parse(h.storage.get('ro3_a')),{agent:'Agent Test',role:'agent'});
    assert.equal(h.storage.has('ro3_u'),false,'user directory must not be cached');
    assert.equal(h.afterLoadCalls,1,'afterLoad lifecycle must still fire');
  }
  {
    const h=makeContext({session:false});
    await h.ctx.window.load();
    assert.equal(h.legacyLoadCalls,0,'unauthenticated post-bootstrap load must not call legacy direct-table loader');
    assert.equal(h.ctx.S.agent,null);
    assert.equal(h.ctx.S.role,null);
    assert.equal(h.ctx.S.users.length,0);
    assert.equal(h.afterLoadCalls,1);
  }
  {
    const h=makeContext({session:true,role:'chef_chantier'});
    await h.ctx.window.load();
    const rpcNames=h.calls.filter(x=>x[0]==='rpc').map(x=>x[1]);
    assert.ok(rpcNames.includes('railops_chef_chantier_tree_stats'));
    assert.equal(h.ctx.S.chefChantierStats.length,1);
  }
  {
    const h=makeContext({session:true,role:'chef'});
    await h.ctx.window.load();
    const rpcNames=h.calls.filter(x=>x[0]==='rpc').map(x=>x[1]);
    assert.ok(rpcNames.includes('railops_catalogue_scope'));
  }
  assert.equal(/\.from\(\s*['"]users['"]\s*\)/.test(source),false,'lifecycle secure loader must never access users directly');
  console.log('PASS: secure lifecycle load uses scoped RPCs and preserves hooks');
})().catch(err=>{console.error(err);process.exit(1);});
