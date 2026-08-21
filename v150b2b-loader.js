(function(){
'use strict';
const VERSION='150B2B-client-2';
const BRIDGE='railops-auth-bridge';
let remoteMultiMap=new Map();
let pollTimer=null;

function roToast(msg,type='info'){try{if(typeof toast==='function')toast(msg,type);}catch(e){}}
function businessRef(m){try{return window.RailOpsStableV140?.businessRef?.(m)||String(m?.id||'').replace(/__MC__.*/i,'').trim().toUpperCase();}catch(e){return String(m?.id||'').replace(/__MC__.*/i,'').trim().toUpperCase();}}
function safeLocalSave(){
  try{localStorage.setItem('ro3_c',JSON.stringify(S.chantiers||[]));}catch(e){}
  try{localStorage.setItem('ro3_m',JSON.stringify(S.mat||[]));}catch(e){}
  try{localStorage.setItem('ro3_s',JSON.stringify(S.scans||[]));}catch(e){}
  try{localStorage.setItem('ro3_a',JSON.stringify({agent:S.agent,role:S.role,auth:true,isAdminOwner:!!S.isAdminOwner}));}catch(e){}
  try{localStorage.removeItem('ro3_u');}catch(e){}
}
function clearSession(){
  try{localStorage.removeItem('ro3_a');localStorage.removeItem('ro3_u');}catch(e){}
  try{S.agent=null;S.role=null;S.isAdminOwner=false;S.__ownerAdminMode=false;S.page='login';S.modal=null;S.curC=null;S.curM=null;S.users=[];S.mat=[];S.scans=[];S.chantiers=[];}catch(e){}
}
async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data;}

async function loadRemoteMulti(){
  remoteMultiMap=new Map();
  if(!['chef','admin'].includes(S.role))return;
  try{
    const rows=await rpc('railops_multi_map');
    for(const row of rows||[]){const ref=String(row.reference||'').toUpperCase();if(!remoteMultiMap.has(ref))remoteMultiMap.set(ref,[]);remoteMultiMap.get(ref).push(String(row.chantier_label||''));}
    for(const [k,v] of remoteMultiMap)remoteMultiMap.set(k,[...new Set(v.filter(Boolean))]);
  }catch(e){console.warn('[RailOps v150B-2B] multi map',e);}
}
function decorateRemoteMulti(){
  try{
    document.querySelectorAll('.ro-v150b2b-remote-mc').forEach(x=>x.remove());
    if(!['chef','admin'].includes(S.role))return;
    for(const row of document.querySelectorAll('.reg-item[id^="ri-"]')){
      const id=row.id.slice(3);const m=(S.mat||[]).find(x=>String(x.id)===id);if(!m)continue;
      const labels=remoteMultiMap.get(businessRef(m))||[];if(!labels.length)continue;
      const b=document.createElement('div');b.className='ro-v140-mc ro-v150b2b-remote-mc';b.innerHTML=`<strong>Multi-chantier</strong> · aussi sur ${labels.join(' · ')}`;
      row.querySelector('.reg-top')?.insertAdjacentElement('afterend',b);
    }
  }catch(e){console.warn('[RailOps v150B-2B] decorate multi',e);}
}

async function secureLoad(){
  const session=(await db.auth.getSession())?.data?.session;
  if(!session){clearSession();return;}
  const ctx=await rpc('railops_session_context');
  if(!ctx?.ok)throw new Error(ctx?.code||'NO_RAILOPS_PROFILE');
  S.agent=ctx.nom;
  S.role=ctx.role;
  S.isAdminOwner=!!ctx.is_admin_owner;
  S.__ownerAdminMode=false;
  S.page=S.page==='login'?'dashboard':(S.page||'dashboard');
  const [chantiers,mat,scans,users]=await Promise.all([
    rpc('railops_chantiers_scope'),rpc('railops_materials_scope'),rpc('railops_scans_scope'),rpc('railops_user_directory')
  ]);
  S.chantiers=chantiers||[];
  S.mat=typeof normMats==='function'?normMats(mat||[]):(mat||[]);
  S.scans=scans||[];
  S.users=(users||[]).map(u=>({id:u.id,nom:u.nom,badge:u.badge,role:u.role,is_admin:!!u.is_admin}));
  S.prixCatalogue=[];
  if(['chef','admin'].includes(S.role)){
    try{S.prixCatalogue=await rpc('railops_catalogue_scope')||[];}catch(e){console.warn('[RailOps v150B-2B] catalogue',e);}
  }
  await loadRemoteMulti();
  safeLocalSave();
  setTimeout(decorateRemoteMulti,40);
}

async function secureLogin(login,password){
  const {data,error}=await db.functions.invoke(BRIDGE,{body:{login,password}});
  if(error||!data?.ok||!data?.session)throw new Error(data?.code||'AUTH_FAILED');
  const {error:setErr}=await db.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token});
  if(setErr)throw setErr;
  await secureLoad();
  render();
  if(data.migrated)roToast('Compte sécurisé avec Supabase Auth ✓','ok');
}

doLogin=async function(){
  const login=document.getElementById('ln')?.value?.trim();
  const password=document.getElementById('lp')?.value||'';
  if(!login||!password){roToast('Veuillez renseigner vos identifiants.','danger');return;}
  const btn=document.querySelector('#login button,button[onclick="doLogin()"]');
  if(btn){btn.disabled=true;btn.dataset.ro150b2bOld=btn.textContent||'';btn.textContent='Connexion sécurisée…';}
  try{await secureLogin(login,password);}catch(e){console.error('[RailOps v150B-2B] login',e);roToast('Identifiant ou mot de passe incorrect.','danger');}
  finally{if(btn){btn.disabled=false;btn.textContent=btn.dataset.ro150b2bOld||'Se connecter';delete btn.dataset.ro150b2bOld;}}
};
window.doLogin=doLogin;

const legacyLogout=typeof doLogout==='function'?doLogout:null;
doLogout=async function(){try{await db.auth.signOut();}catch(e){}clearSession();if(legacyLogout){try{return legacyLogout.apply(this,arguments);}catch(e){}}render();};
window.doLogout=doLogout;

load=async function(){
  try{await secureLoad();}
  catch(e){console.error('[RailOps v150B-2B] load',e);clearSession();roToast('Session sécurisée expirée. Reconnectez-vous.','info');}
};
window.load=load;

loadPrixCatalogue=async function(){if(!['chef','admin'].includes(S.role)){S.prixCatalogue=[];return;}try{S.prixCatalogue=await rpc('railops_catalogue_scope')||[];}catch(e){S.prixCatalogue=[];}};
window.loadPrixCatalogue=loadPrixCatalogue;

saveMat=async function(id){
  const m=(S.mat||[]).find(x=>x.id===id);if(!m)return;
  const full=['chef','admin'].includes(S.role);
  const keys=full?['nom','cat','chantierId','etat','scan','presence','echeance','verifLundi','verifSemaine','controle2m']:['etat','scan','presence','verifLundi','verifSemaine','controle2m'];
  const patch={};for(const k of keys)if(Object.prototype.hasOwnProperty.call(m,k))patch[k]=m[k];
  try{const row=await rpc('railops_save_material_state',{p_id:id,p_patch:patch});if(row&&typeof row==='object')Object.assign(m,row);safeLocalSave();}
  catch(e){console.error('[RailOps v150B-2B] saveMat',e);roToast('Écriture matériel refusée ou indisponible.','danger');throw e;}
};
window.saveMat=saveMat;

saveChantier=async function(id){
  const c=(S.chantiers||[]).find(x=>x.id===id);if(!c)return;
  try{
    if(['agent','cte'].includes(S.role)){
      const tournees=(c.tournees||[]).map(t=>({...t,visites:(t.visites||[]).map(v=>({...v,sigAgent:null,sigCte:null,photos:(v.photos||[]).map(p=>({...p,data:null}))}))}));
      await rpc('railops_save_tournees',{p_chantier_id:id,p_tournees:tournees});
    }else if(['chef','admin'].includes(S.role)){
      const payload={id:c.id,nom:c.nom||'',lieu:c.lieu||'',chef:c.chefs?.[0]||c.chef||'',chefs:c.chefs||[],statut:c.statut||'actif',desc:c.desc||'',dateDebut:c.dateDebut||'',dateFin:c.dateFin||'',agents:c.agents||[],tournees:c.tournees||[],dateTermine:c.dateTermine||'',parent_id:c.parent_id||null,jourReset:c.jourReset??null,responsableSemaine:c.responsableSemaine||''};
      const {error}=await db.from('chantiers').upsert([payload],{onConflict:'id'});if(error)throw error;
    } else { throw new Error('ROLE_FORBIDDEN'); }
    safeLocalSave();
  }catch(e){console.error('[RailOps v150B-2B] saveChantier',e);roToast('Écriture chantier refusée ou indisponible.','danger');throw e;}
};
window.saveChantier=saveChantier;

save=async function(){
  safeLocalSave();
  const pending=(S.scans||[]).filter(x=>x?._pending);
  for(const s of pending){
    const payload={...s};delete payload._pending;
    try{await rpc('railops_upsert_scan',{p_scan:payload});delete s._pending;const m=(S.mat||[]).find(x=>x.id===s.materielId);if(m)await saveMat(m.id);}catch(e){console.warn('[RailOps v150B-2B] pending scan',e);}
  }
  safeLocalSave();
};
window.save=save;

flushOfflineQueue=async function(){
  const q=typeof getOfflineQueue==='function'?getOfflineQueue():[];if(!q.length||!navigator.onLine)return;
  let done=0;const remain=[];
  for(const item of q){
    try{
      if(item.type==='scan'){
        await rpc('railops_upsert_scan',{p_scan:item.data});
        const m=(S.mat||[]).find(x=>x.id===item.data?.materielId);if(m)await saveMat(m.id);
      }else if(item.type==='materiel'){
        if(['chef','admin'].includes(S.role))await rpc('railops_upsert_material_admin',{p_item:item.data});
        else await rpc('railops_save_material_state',{p_id:item.data?.id,p_patch:{etat:item.data?.etat,scan:item.data?.scan,presence:item.data?.presence,verifLundi:item.data?.verifLundi,verifSemaine:item.data?.verifSemaine,controle2m:item.data?.controle2m}});
      }
      done++;
    }catch(e){remain.push(item);}
  }
  if(typeof saveOfflineQueue==='function')saveOfflineQueue(remain);if(typeof updateOfflineBadge==='function')updateOfflineBadge();if(done)roToast(`${done} opération(s) hors-ligne synchronisée(s) ✓`,'ok');
};
window.flushOfflineQueue=flushOfflineQueue;

setupRealtime=function(){
  try{if(S._realtimeChannel){db.removeChannel(S._realtimeChannel);S._realtimeChannel=null;}}catch(e){}
  return null;
};
window.setupRealtime=setupRealtime;

function startSecurePolling(){
  if(pollTimer)clearInterval(pollTimer);
  pollTimer=setInterval(async()=>{try{const ses=(await db.auth.getSession())?.data?.session;if(!ses||S.page==='login')return;if(S.__ownerAdminMode&&window.RailOpsOwnerMode150B2B?.reloadAdmin){await window.RailOpsOwnerMode150B2B.reloadAdmin(false);}else{await secureLoad();if(typeof renderTab==='function')renderTab();decorateRemoteMulti();}}catch(e){}},45000);
}

try{
  const oldRender=render;
  render=function(){const r=oldRender.apply(this,arguments);setTimeout(decorateRemoteMulti,25);return r;};
  window.render=render;
}catch(e){}

try{db.auth.onAuthStateChange((event,session)=>{if(!session&&event==='SIGNED_OUT'){clearSession();render();}});}catch(e){}
startSecurePolling();

setTimeout(async()=>{
  try{
    const ses=(await db.auth.getSession())?.data?.session;
    if(ses){await secureLoad();render();}else if(S?.agent){clearSession();render();}
  }catch(e){console.warn('[RailOps v150B-2B] initial session',e);}
},500);

window.RailOpsSecurity150B2B={version:VERSION,reload:secureLoad,multi:()=>remoteMultiMap,context:()=>({role:S?.role||null,isAdminOwner:!!S?.isAdminOwner,adminMode:!!S?.__ownerAdminMode})};
console.info('[RailOps] v150B-2B client sécurisé chargé —',VERSION);
})();