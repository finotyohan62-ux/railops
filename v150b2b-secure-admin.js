(function(){
'use strict';
const VERSION='150B2B-secure-admin-1';
const REGISTER_FN='railops-register';
const USER_ADMIN_FN='railops-user-admin';
function msg(text,type='info'){try{if(typeof toast==='function')toast(text,type);}catch(e){}}
async function invoke(name,body){const {data,error}=await db.functions.invoke(name,{body});if(error)throw error;if(!data?.ok){const err=new Error(data?.code||'SERVER_ERROR');err.code=data?.code;throw err;}return data;}
async function refresh(){try{if(window.RailOpsSecurity150B2B?.reload){await window.RailOpsSecurity150B2B.reload();if(typeof render==='function')render();}}catch(e){console.warn('[RailOps v150B-2B] refresh',e);}}
function userById(id){return (S.users||[]).find(u=>String(u.id)===String(id));}
function myUser(){return (S.users||[]).find(u=>String(u.nom||'')===String(S.agent||''));}
function errText(code){return ({INVALID_INPUT:'Informations incomplètes ou invalides.',INVITATION_INVALID:"Code d’invitation incorrect.",NAME_EXISTS:'Ce nom est déjà utilisé.',BADGE_EXISTS:'Ce matricule est déjà utilisé.',PASSWORD_TOO_SHORT:'Mot de passe trop court (6 caractères minimum).',FORBIDDEN:'Action non autorisée.',OWNER_PROTECTED:'Le compte propriétaire est protégé.',USER_NOT_AUTH_LINKED:'Ce compte doit d’abord se connecter une fois pour être migré vers Supabase Auth.'})[code]||'Opération refusée ou indisponible.';}

// Inscription : aucun accès navigateur à app_config ni users.mdp.
doInscription=async function(){
  const nom=document.getElementById('in-nom')?.value?.trim();
  const badge=document.getElementById('in-badge')?.value?.trim();
  const password=document.getElementById('in-mdp')?.value||'';
  const password2=document.getElementById('in-mdp2')?.value||'';
  const invitation=document.getElementById('in-code')?.value?.trim()||'';
  const role=document.getElementById('in-role')?.value||window._ir||null;
  if(!nom||!badge||!password||!password2){msg('Veuillez remplir tous les champs.','danger');return;}
  if(!role){msg('Choisissez un rôle.','danger');return;}
  if(password.length<6){msg('Mot de passe trop court (6 caractères minimum).','danger');return;}
  if(password!==password2){msg('Les mots de passe ne correspondent pas.','danger');return;}
  try{
    const data=await invoke(REGISTER_FN,{nom,badge,password,role,invitation_code:invitation});
    const {error}=await db.auth.setSession({access_token:data.session.access_token,refresh_token:data.session.refresh_token});
    if(error)throw error;
    await refresh();
    msg(`Bienvenue ${nom.split(/\s+/)[0]} 👋`,'ok');
  }catch(e){console.error('[RailOps v150B-2B] inscription',e);msg(errText(e.code||e.message),'danger');}
};
window.doInscription=doInscription;

// Modifications simples de profil : propriétaire Admin uniquement.
saveUser=async function(id){
  const u=userById(id);if(!u)return;
  if(S.role!=='admin'){msg('Action réservée au propriétaire Admin.','danger');await refresh();return;}
  try{
    const data=await invoke(USER_ADMIN_FN,{action:'update_profile',user_id:u.id,badge:u.badge,role:u.role});
    if(data.user)Object.assign(u,data.user);
    try{localStorage.removeItem('ro3_u');}catch(e){}
  }catch(e){console.error('[RailOps v150B-2B] saveUser',e);msg(errText(e.code||e.message),'danger');await refresh();}
};
window.saveUser=saveUser;

doDeleteUser=async function(id){
  const u=userById(id);if(!u)return;
  if(S.role!=='admin'){msg('Action réservée au propriétaire Admin.','danger');return;}
  try{
    await invoke(USER_ADMIN_FN,{action:'delete_user',user_id:id});
    S.users=(S.users||[]).filter(x=>String(x.id)!==String(id));
    document.getElementById('movl')?.remove();
    setTimeout(()=>{try{openGestionComptes();}catch(e){}},50);
    msg('Compte supprimé.','ok');
  }catch(e){console.error('[RailOps v150B-2B] delete user',e);msg(errText(e.code||e.message),'danger');await refresh();}
};
window.doDeleteUser=doDeleteUser;

// Mot de passe : soi-même, ou n’importe quel autre compte uniquement pour l’Admin propriétaire.
doChangePass=async function(id,selfMode){
  const p1=document.getElementById('new-mdp')?.value||'';
  const p2=document.getElementById('new-mdp2')?.value||'';
  if(p1.length<6){msg('Mot de passe trop court (6 caractères minimum).','danger');return;}
  if(p1!==p2){msg('Les mots de passe ne correspondent pas.','danger');return;}
  const target=selfMode?(myUser()?.id):id;
  if(!target){msg('Compte introuvable.','danger');return;}
  try{
    await invoke(USER_ADMIN_FN,{action:'change_password',user_id:target,password:p1});
    document.getElementById('movl')?.remove();
    msg('Mot de passe mis à jour ✓','ok');
  }catch(e){console.error('[RailOps v150B-2B] password',e);msg(errText(e.code||e.message),'danger');}
};
window.doChangePass=doChangePass;

// L’ancien reset nom+matricule est volontairement neutralisé : trop faible pour Auth.
openForgotPassword=function(){msg('Pour réinitialiser votre mot de passe, contactez le propriétaire RailOps.','info');};
window.openForgotPassword=openForgotPassword;
doForgotStep1=openForgotPassword;window.doForgotStep1=doForgotStep1;
doForgotStep2=openForgotPassword;window.doForgotStep2=doForgotStep2;

// Catalogue : Chef ou propriétaire, via RPC uniquement.
savePrixCatalogue=async function(){
  try{
    const rows=(S.prixCatalogue||[]).map(x=>({ref:String(x.ref||'').trim(),prix:x.prix,description:x.description||''})).filter(x=>x.ref&&x.prix!==null&&x.prix!==undefined&&x.prix!=='');
    await db.rpc('railops_catalogue_upsert',{p_rows:rows});
    try{localStorage.setItem('ro_prix_catalogue',JSON.stringify(S.prixCatalogue||[]));}catch(e){}
  }catch(e){console.error('[RailOps v150B-2B] catalogue save',e);msg('Enregistrement du catalogue refusé ou indisponible.','danger');}
};
window.savePrixCatalogue=savePrixCatalogue;

deletePrixCatalogue=async function(ref){
  S.prixCatalogue=(S.prixCatalogue||[]).filter(x=>String(x.ref)!==String(ref));
  try{await db.rpc('railops_catalogue_delete',{p_ref:String(ref)});try{localStorage.setItem('ro_prix_catalogue',JSON.stringify(S.prixCatalogue||[]));}catch(e){}}catch(err){console.error('[RailOps v150B-2B] catalogue delete',err);msg('Suppression du prix refusée ou indisponible.','danger');await refresh();}
};
window.deletePrixCatalogue=deletePrixCatalogue;

window.RailOpsSecureAdmin150B2B={version:VERSION};
console.info('[RailOps] fonctions sensibles sécurisées —',VERSION);
})();