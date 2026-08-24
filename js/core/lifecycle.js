(function(){
'use strict';
if(window.RailOpsLifecycleV155)return;
const VERSION='155-lifecycle-secure-load';
const beforeRenderHandlers=new Map();
const afterRenderHandlers=new Map();
const afterLoadHandlers=new Map();
const mutationHandlers=new Map();
let adminModeV155=false;
let adminToggleBusyV155=false;

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
    S.__ownerAdminMode=false;
    adminModeV155=false;
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
  S.isAdminOwner=!!ctx.is_admin_owner;
  if(!S.isAdminOwner)adminModeV155=false;
  const effectiveRole=adminModeV155&&S.isAdminOwner?'admin':ctx.role;
  S.role=effectiveRole;
  S.__ownerAdminMode=effectiveRole==='admin';
  S.page=S.page==='login'?'dashboard':(S.page||'dashboard');

  const chefStatsPromise=effectiveRole==='chef_chantier'
    ?rpcV155('railops_chef_chantier_tree_stats')
    :Promise.resolve([]);
  const chantierRpc=effectiveRole==='admin'?'railops_admin_chantiers_scope':'railops_chantiers_scope';
  const materialRpc=effectiveRole==='admin'?'railops_admin_materials_scope':'railops_materials_scope';
  const scanRpc=effectiveRole==='admin'?'railops_admin_scans_scope':'railops_scans_scope';

  const [chantiers,materiels,scans,users,chefStats]=await Promise.all([
    rpcV155(chantierRpc),
    rpcV155(materialRpc),
    rpcV155(scanRpc),
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
  S.chefChantierStats=effectiveRole==='chef_chantier'?(chefStats||[]):[];

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

async function enterAdminModeV155(){
  if(!S?.isAdminOwner)throw new Error('ADMIN_REQUIRED');
  adminModeV155=true;
  S.__ownerAdminMode=true;
  S.page='dashboard';S.curC=null;S.curM=null;
  return window.load();
}
async function exitAdminModeV155(){
  adminModeV155=false;
  S.__ownerAdminMode=false;
  S.page='dashboard';S.curC=null;S.curM=null;
  return window.load();
}
function addAdminToggleV155(){
  try{
    const existing=typeof document.getElementById==='function'?document.getElementById('ro-v155-admin-toggle'):null;
    if(existing&&typeof existing.remove==='function')existing.remove();
    if(!S?.agent||!S?.isAdminOwner||typeof document.querySelector!=='function'||typeof document.createElement!=='function')return;
    const top=document.querySelector('.topbar');if(!top)return;
    const b=document.createElement('button');
    b.id='ro-v155-admin-toggle';b.type='button';
    b.textContent=adminModeV155?'← Mode Chef':'Administration';
    b.style.cssText='border:.5px solid var(--border);background:var(--bg3);color:var(--text);padding:7px 10px;border-radius:9px;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0';
    b.onclick=async()=>{
      if(adminToggleBusyV155)return;adminToggleBusyV155=true;b.disabled=true;
      try{
        if(adminModeV155){await exitAdminModeV155();if(typeof toast==='function')toast('Retour au mode Chef d’équipe','ok');}
        else{await enterAdminModeV155();if(typeof toast==='function')toast('Mode Administration','ok');}
        if(typeof render==='function')render();
      }catch(e){console.error('[RailOps admin mode]',e);if(typeof toast==='function')toast('Impossible de changer de mode.','danger');}
      finally{adminToggleBusyV155=false;}
    };
    top.appendChild(b);
  }catch(e){console.warn('[RailOps v155] bouton admin',e);}
}
window.RailOpsLifecycleV155.afterRender('admin-mode-toggle',addAdminToggleV155);
window.RailOpsAdminModeV155={
  version:'155-admin-mode-toggle',
  enter:enterAdminModeV155,
  exit:exitAdminModeV155,
  isActive:()=>adminModeV155,
  refreshButton:addAdminToggleV155
};

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
