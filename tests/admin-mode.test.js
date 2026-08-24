const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../js/core/lifecycle.js','utf8');

function harness({owner=true,role='chef'}={}){
  const calls=[];
  const store=new Map();
  const elements=new Map();
  const topbar={appendChild(el){elements.set(el.id,el);}};
  const ctx={ok:true,nom:'Owner Test',badge:'B1',role,is_admin_owner:owner};
  const data={
    railops_session_context:ctx,
    railops_chantiers_scope:[{id:'C-business'}],
    railops_materials_scope:[{id:'M-business'}],
    railops_scans_scope:[{id:'S-business'}],
    railops_admin_chantiers_scope:[{id:'C-admin'}],
    railops_admin_materials_scope:[{id:'M-admin'}],
    railops_admin_scans_scope:[{id:'S-admin'}],
    railops_user_directory:[{id:'U1',nom:'Owner Test',badge:'B1',role,is_admin:owner}],
    railops_catalogue_scope:[]
  };
  const context={
    console:{info(){},warn(){},error(){}},Map,Promise,Array,Object,String,TypeError,JSON,
    setTimeout(){return 1;},clearTimeout(){},
    MutationObserver:class{observe(){}},
    navigator:{onLine:true},
    document:{
      getElementById(id){return id==='app'?{}:(elements.get(id)||null);},
      querySelector(sel){return sel==='.topbar'?topbar:null;},
      createElement(){return {style:{},remove(){if(this.id)elements.delete(this.id);}};},
      body:{}
    },
    localStorage:{setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),getItem:k=>store.get(k)||null},
    S:{page:'dashboard',agent:null,role:null,isAdminOwner:false,users:[],mat:[],scans:[],chantiers:[],prixCatalogue:[]},
    db:{auth:{getSession:async()=>({data:{session:{access_token:'t'}}})},rpc:async name=>{calls.push(name);return {data:data[name],error:null};}},
    normMats:x=>x,setupRealtime(){},render(){},load:async()=>{}
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(source,context,{filename:'lifecycle.js'});
  return {context,calls,elements};
}

(async()=>{
  const h=harness();
  assert.ok(h.context.RailOpsAdminModeV155,'admin mode API must exist');
  await h.context.load();
  assert.equal(h.context.S.role,'chef');
  assert.ok(h.calls.includes('railops_chantiers_scope'));
  assert.ok(!h.calls.includes('railops_admin_chantiers_scope'));
  h.context.render();
  const button=h.elements.get('ro-v155-admin-toggle');
  assert.ok(button,'admin owner must see the Administration button');
  assert.equal(button.textContent,'Administration');
  assert.equal(/\.from\(\s*['"]users['"]\s*\)/.test(source),false,'admin mode must never access users directly');

  h.calls.length=0;
  await h.context.RailOpsAdminModeV155.enter();
  assert.equal(h.context.S.role,'admin');
  assert.equal(h.context.S.__ownerAdminMode,true);
  assert.ok(h.calls.includes('railops_admin_chantiers_scope'));
  assert.equal(h.context.S.chantiers[0].id,'C-admin');
  h.context.render();
  assert.equal(h.elements.get('ro-v155-admin-toggle').textContent,'← Mode Chef');

  h.calls.length=0;
  await h.context.load();
  assert.equal(h.context.S.role,'admin','regular reload must keep admin mode active');
  assert.ok(h.calls.includes('railops_admin_materials_scope'));

  h.calls.length=0;
  await h.context.RailOpsAdminModeV155.exit();
  assert.equal(h.context.S.role,'chef','exit must restore server business role');
  assert.equal(h.context.S.__ownerAdminMode,false);
  assert.ok(h.calls.includes('railops_materials_scope'));

  const no=harness({owner:false});
  await no.context.load();
  no.context.render();
  assert.equal(no.elements.has('ro-v155-admin-toggle'),false,'non-admin must not see admin toggle');
  await assert.rejects(()=>no.context.RailOpsAdminModeV155.enter(),/ADMIN_REQUIRED/);
  assert.equal(no.context.S.role,'chef');
  assert.ok(!no.calls.includes('railops_admin_chantiers_scope'));

  console.log('admin mode lifecycle regression: OK');
})().catch(e=>{console.error(e);process.exit(1);});
