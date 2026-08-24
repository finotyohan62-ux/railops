(function(){
'use strict';
if(window.RailOpsLifecycleV155)return;
const VERSION='155-lifecycle-secure-load';
const beforeRenderHandlers=new Map();
const afterRenderHandlers=new Map();
const afterLoadHandlers=new Map();
const mutationHandlers=new Map();

function add(map,name,fn){
  if(!name||typeof fn!=='function')throw new TypeError('RailOps lifecycle: handler invalide');
  map.set(String(name),fn);
  return fn;
}
function runSync(map,ctx,args){
  for(const [name,fn] of map){
    try{fn.apply(ctx,args);}catch(e){console.warn('[RailOps v155] '+name,e);}
  }
}
async function runAsync(map,ctx,args){
  for(const [name,fn] of map){
    try{await fn.apply(ctx,args);}catch(e){console.warn('[RailOps v155] '+name,e);}
  }
}
async function rpcV155(name,args){
  const {data,error}=await db.rpc(name,args||{});
  if(error)throw error;
  return data;
}
function saveSecureCacheV155(){
  try{localStorage.setItem('ro3_c',JSON.stringify(S.chantiers||[]));}catch(e){}
  try{localStorage.setItem('ro3_m',JSON.stringify(S.mat||[]));}catch(e){}
  try{localStorage.setItem('ro3_s',JSON.stringify(S.scans||[]));}catch(e){}
  try{localStorage.setItem('ro3_a',JSON.stringify({agent:S.agent,role:S.role}));}catch(e){}
  try{localStorage.removeItem('ro3_u');}catch(e){}
}
function clearUnauthenticatedStateV155(){
  try{localStorage.removeItem('ro3_a');localStorage.removeItem('ro3_u');}catch(e){}
  try{
    S.agent=null;
    S.role=null;
    S.isAdminOwner=false;
    S.page='login';
    S.modal=null;
    S.curC=null;
    S.curM=null;
    S.users=[];
    S.chefChantierStats=[];
  }catch(e){}
}
async function secureLoadV155(){
  const session=(await db.auth.getSession())?.data?.session;
  if(!session){
    clearUnauthenticatedStateV155();
    return null;
  }

  const ctx=await rpcV155('railops_session_context');
  if(!ctx?.ok)throw new Error(ctx?.code||'NO_RAILOPS_PROFILE');

  S.agent=ctx.nom;
  S.role=ctx.role;
  S.isAdminOwner=!!ctx.is_admin_owner;
  S.page=S.page==='login'?'dashboard':(S.page||'dashboard');

  const chefStatsPromise=ctx.role==='chef_chantier'
    ?rpcV155('railops_chef_chantier_tree_stats')
    :Promise.resolve([]);

  const [chantiers,materiels,scans,users,chefStats]=await Promise.all([
    rpcV155('railops_chantiers_scope'),
    rpcV155('railops_materials_scope'),
    rpcV155('railops_scans_scope'),
    rpcV155('railops_user_directory'),
    chefStatsPromise
  ]);

  S.chantiers=chantiers||[];
  S.mat=typeof normMats==='function'?normMats(materiels||[]):(materiels||[]);
  S.scans=scans||[];
  S.users=(users||[]).map(u=>({
    id:u.id,
    nom:u.nom,
    badge:u.badge,
    role:u.role,
    is_admin:!!u.is_admin
  }));
  S.chefChantierStats=ctx.role==='chef_chantier'?(chefStats||[]):[];

  S.prixCatalogue=[];
  if(['chef','admin'].includes(S.role)){
    try{S.prixCatalogue=await rpcV155('railops_catalogue_scope')||[];}
    catch(e){console.warn('[RailOps v155] catalogue',e);}
  }

  saveSecureCacheV155();
  return ctx;
}

const api={
  version:VERSION,
  beforeRender(name,fn){return add(beforeRenderHandlers,name,fn);},
  afterRender(name,fn){return add(afterRenderHandlers,name,fn);},
  afterLoad(name,fn){return add(afterLoadHandlers,name,fn);},
  onMutation(name,fn){return add(mutationHandlers,name,fn);},
  inspect(){return {
    beforeRender:[...beforeRenderHandlers.keys()],
    afterRender:[...afterRenderHandlers.keys()],
    afterLoad:[...afterLoadHandlers.keys()],
    mutation:[...mutationHandlers.keys()]
  };}
};
window.RailOpsLifecycleV155=api;

const baseRenderV155=window.render;
if(typeof baseRenderV155==='function'){
  const sharedRenderV155=function(){
    runSync(beforeRenderHandlers,this,arguments);
    const result=baseRenderV155.apply(this,arguments);
    runSync(afterRenderHandlers,this,arguments);
    return result;
  };
  window.render=sharedRenderV155;
  try{render=sharedRenderV155;}catch(e){}
}

const baseLoadV155=window.load;
if(typeof baseLoadV155==='function'){
  const sharedLoadV155=async function(){
    const result=await secureLoadV155();
    await runAsync(afterLoadHandlers,this,arguments);
    return result;
  };
  window.load=sharedLoadV155;
  try{load=sharedLoadV155;}catch(e){}
  window.RailOpsSecureLoadV155={load:sharedLoadV155,secureLoad:secureLoadV155};
}

const mutationRootV155=document.getElementById('app')||document.body;
if(mutationRootV155){
  const observerV155=new MutationObserver(mutations=>runSync(mutationHandlers,null,[mutations]));
  observerV155.observe(mutationRootV155,{childList:true,subtree:true,characterData:true});
}

// Restore an existing Supabase session after all inline adapters have registered
// their lifecycle hooks. Offline startup keeps the already-loaded local cache.
setTimeout(async()=>{
  try{
    if(typeof db==='undefined'||!db?.auth?.getSession)return;
    const session=(await db.auth.getSession())?.data?.session;
    if(session){
      await window.load();
      if(typeof render==='function')render();
      if(typeof setupRealtime==='function')setupRealtime();
    }else if(typeof navigator==='undefined'||navigator.onLine!==false){
      clearUnauthenticatedStateV155();
      if(typeof render==='function')render();
    }
  }catch(e){
    if(typeof navigator==='undefined'||navigator.onLine!==false){
      console.warn('[RailOps v155] restauration session',e);
    }
  }
},600);

console.info('[RailOps] cycle partagé + chargement sécurisé actif —',VERSION);
})();
