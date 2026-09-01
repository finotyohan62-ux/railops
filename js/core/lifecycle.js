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

// Compatibility layer for structured Excel registers whose visible counters can be stale
// and whose source contains exact duplicates inside the same site. The original v145
// importer remains the only code that creates/moves material and chantiers.
function installRegisterImportToleranceV155(){
  if(window.RailOpsRegisterImportToleranceV155?.installed)return true;
  if(typeof XLSX==='undefined'||typeof window.importCSV!=='function')return false;
  const baseImport=window.importCSV;

  function textV155(v){return String(v??'').trim();}
  function keyV155(v){return textV155(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function siteKeyV155(v){return textV155(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'');}
  function refV155(v){
    if(window.RailOpsImportFix?.normalizeReference)return window.RailOpsImportFix.normalizeReference(v);
    return textV155(v).normalize('NFKC').toUpperCase().replace(/[‐‑‒–—−]/g,'-').replace(/\s+/g,'').replace(/[^A-Z0-9._\/-]/g,'-').replace(/-{2,}/g,'-').replace(/^-+|-+$/g,'');
  }
  function headerInfoV155(rows){
    for(let r=0;r<Math.min(30,rows.length);r++){
      const h=(Array.isArray(rows[r])?rows[r]:[]).map(keyV155);
      const refCol=h.findIndex(x=>/^(ref|reference|references|ref materiel|reference materiel|code|code materiel|identifiant)$/.test(x)||x.startsWith('ref '));
      const siteCol=h.findIndex(x=>/^(site|zone|emplacement|affectation|sous chantier|sous chantier actuel|chantier|lieu)$/.test(x)||/site actuel|zone actuelle|sous chantier/.test(x));
      if(refCol>=0&&siteCol>=0)return {headerIdx:r,refCol,siteCol};
    }
    return null;
  }
  function normalizeStructuredRowsV155(rows){
    const info=headerInfoV155(rows);if(!info)return null;
    const seen=new Map(),sitesByRef=new Map(),duplicateRows=[];
    for(let r=info.headerIdx+1;r<rows.length;r++){
      const row=Array.isArray(rows[r])?rows[r]:[];
      const ref=refV155(row[info.refCol]);if(!ref)continue;
      const site=siteKeyV155(row[info.siteCol]);if(!site)continue;
      const k=site+'|'+ref;
      if(seen.has(k)){duplicateRows.push(r);continue;}
      seen.set(k,r);
      if(!sitesByRef.has(ref))sitesByRef.set(ref,new Set());
      sitesByRef.get(ref).add(site);
    }
    const crossSiteDuplicate=[...sitesByRef.entries()].filter(([,sites])=>sites.size>1);
    // Destination ambiguity stays under v145's normal blocking policy.
    if(crossSiteDuplicate.length)return null;
    const clean=rows.map(row=>Array.isArray(row)?row.slice():[]);
    for(const r of duplicateRows.slice().sort((a,b)=>b-a))clean.splice(r,1);
    const uniqueCount=seen.size;
    let declaredMismatch=false;
    const topLimit=Math.min(info.headerIdx,clean.length);
    for(let r=0;r<topLimit;r++){
      for(let c=0;c<(clean[r]||[]).length;c++){
        const raw=textV155(clean[r][c]);if(!raw)continue;
        const m=raw.match(/(\d{1,5})(\s*(?:articles?|materiels?|matériels?|references?|références?))/i);
        if(!m)continue;
        const declared=Number(m[1]);
        if(declared&&declared!==uniqueCount){
          declaredMismatch=true;
          clean[r][c]=raw.replace(m[0],String(uniqueCount)+m[2]);
        }
      }
    }
    if(!duplicateRows.length&&!declaredMismatch)return null;
    return {rows:clean,duplicateRows,declaredMismatch,uniqueCount};
  }
  function normalizeWorkbookV155(wb){
    const reports=[];
    for(const name of wb.SheetNames||[]){
      const sheet=wb.Sheets[name];if(!sheet)continue;
      const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false,dateNF:'dd/mm/yyyy',blankrows:false});
      const normalized=normalizeStructuredRowsV155(rows);if(!normalized)continue;
      wb.Sheets[name]=XLSX.utils.aoa_to_sheet(normalized.rows);
      reports.push({sheet:name,duplicateRows:normalized.duplicateRows.length,declaredMismatch:normalized.declaredMismatch,uniqueCount:normalized.uniqueCount});
    }
    return reports;
  }
  async function tolerantImportV155(input){
    const file=input?.files?.[0];
    if(!file)return baseImport(input);
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(!['xlsx','xls','xlsm','xlsb','ods'].includes(ext)||typeof file.arrayBuffer!=='function')return baseImport(input);
    try{
      const originalBuffer=await file.arrayBuffer();
      const wb=XLSX.read(originalBuffer,{type:'array',cellDates:true,bookVBA:true});
      const reports=normalizeWorkbookV155(wb);
      if(!reports.length)return baseImport(input);
      const rewritten=XLSX.write(wb,{type:'array',bookType:'xlsx'});
      const syntheticFile={
        name:file.name,
        size:rewritten.byteLength||rewritten.length||file.size||0,
        arrayBuffer:async()=>rewritten
      };
      const duplicates=reports.reduce((n,r)=>n+r.duplicateRows,0);
      const stale=reports.filter(r=>r.declaredMismatch).length;
      console.info('[RailOps v155 import tolerance]',reports);
      if(typeof toast==='function')toast(`Registre contrôlé : ${duplicates} doublon(s) identique(s) neutralisé(s)${stale?' · total annoncé obsolète corrigé pour lecture':''}`,'warn');
      return baseImport({files:[syntheticFile],value:''});
    }catch(e){
      console.warn('[RailOps v155 import tolerance] lecture inchangée',e);
      return baseImport(input);
    }
  }
  window.RailOpsRegisterImportToleranceV155={installed:true,normalizeStructuredRows:normalizeStructuredRowsV155,normalizeWorkbook:normalizeWorkbookV155,baseImport};
  window.importCSV=tolerantImportV155;
  try{importCSV=tolerantImportV155;}catch(e){}
  return true;
}
setTimeout(()=>{if(!installRegisterImportToleranceV155())setTimeout(installRegisterImportToleranceV155,250);},0);

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
