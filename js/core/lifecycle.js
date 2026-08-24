
(function(){
'use strict';
if(window.RailOpsLifecycleV155)return;
const VERSION='155-lifecycle-cleanup';
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

function clearSecureSessionStateV155(){
  try{
    S.agent=null;S.role=null;S.page='login';S.users=[];S.chantiers=[];S.mat=[];S.scans=[];S.prixCatalogue=[];
    S.chefChantierStats=[];S.isAdminOwner=false;
  }catch(e){}
  try{
    localStorage.removeItem('ro3_a');localStorage.removeItem('ro3_u');
  }catch(e){}
}
function saveSecureSessionCacheV155(){
  try{localStorage.setItem('ro3_a',JSON.stringify({agent:S.agent,role:S.role}));}catch(e){}
  try{localStorage.setItem('ro3_c',JSON.stringify(S.chantiers||[]));}catch(e){}
  try{localStorage.setItem('ro3_m',JSON.stringify(S.mat||[]));}catch(e){}
  try{localStorage.setItem('ro3_s',JSON.stringify(S.scans||[]));}catch(e){}
  try{localStorage.removeItem('ro3_u');}catch(e){}
}
async function secureRpcV155(name,args={}){
  const {data,error}=await db.rpc(name,args);
  if(error)throw error;
  return data;
}
async function secureLoadV155(){
  const {data:sessionData,error:sessionError}=await db.auth.getSession();
  if(sessionError)throw sessionError;
  if(!sessionData?.session){clearSecureSessionStateV155();if(typeof render==='function')render();return null;}

  const ctx=await secureRpcV155('railops_session_context');
  if(!ctx?.ok||!ctx?.nom||!ctx?.role)throw new Error(ctx?.code||'NO_RAILOPS_PROFILE');

  const chefStatsPromise=ctx.role==='chef_chantier'
    ?secureRpcV155('railops_chef_chantier_tree_stats')
    :Promise.resolve([]);
  const [chantiers,materiels,scans,users,chefStats]=await Promise.all([
    secureRpcV155('railops_chantiers_scope'),
    secureRpcV155('railops_materials_scope'),
    secureRpcV155('railops_scans_scope'),
    secureRpcV155('railops_user_directory'),
    chefStatsPromise
  ]);

  S.agent=ctx.nom;
  S.role=ctx.role;
  S.isAdminOwner=!!ctx.is_admin_owner;
  S.page=S.page==='login'?'dashboard':(S.page||'dashboard');
  S.chantiers=Array.isArray(chantiers)?chantiers:[];
  S.mat=typeof normMats==='function'?normMats(Array.isArray(materiels)?materiels:[]):(Array.isArray(materiels)?materiels:[]);
  S.scans=Array.isArray(scans)?scans:[];
  S.users=(Array.isArray(users)?users:[]).map(u=>({id:u.id,nom:u.nom,badge:u.badge,role:u.role,is_admin:!!u.is_admin}));
  S.chefChantierStats=ctx.role==='chef_chantier'&&Array.isArray(chefStats)?chefStats:[];
  S.prixCatalogue=[];
  if(ctx.role==='chef'||ctx.role==='admin'){
    try{const catalogue=await secureRpcV155('railops_catalogue_scope');S.prixCatalogue=Array.isArray(catalogue)?catalogue:[];}
    catch(e){console.warn('[RailOps secure load] catalogue',e);}
  }

  saveSecureSessionCacheV155();
  if(typeof render==='function')render();
  return {agent:S.agent,role:S.role};
}
window.RailOpsSecureSessionV155={version:'155-secure-session-load',load:secureLoadV155};

const baseLoadV155=secureLoadV155;
const sharedLoadV155=async function(){
  const result=await baseLoadV155.apply(this,arguments);
  await runAsync(afterLoadHandlers,this,arguments);
  return result;
};
window.load=sharedLoadV155;
try{load=sharedLoadV155;}catch(e){}

const mutationRootV155=document.getElementById('app')||document.body;
if(mutationRootV155){
  const observerV155=new MutationObserver(mutations=>runSync(mutationHandlers,null,[mutations]));
  observerV155.observe(mutationRootV155,{childList:true,subtree:true,characterData:true});
}

console.info('[RailOps] cycle partagé actif —',VERSION);
})();
