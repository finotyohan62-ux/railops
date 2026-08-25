(function(){
'use strict';
const legacySaveUser=window.saveUser;
const legacyDeleteUser=window.doDeleteUser;
const legacyChangePass=window.doChangePass;
function notify(text,type='info'){try{if(typeof toast==='function')toast(text,type);}catch(e){}}
function userById(id){return (S?.users||[]).find(u=>String(u.id)===String(id));}
function selfUser(){return (S?.users||[]).find(u=>String(u.nom||'')===String(S?.agent||''));}
async function hasAuthSession(){try{const {data}=await db.auth.getSession();return !!data?.session?.access_token;}catch(e){return false;}}
async function invokeAdmin(action,body={}){const {data,error}=await db.functions.invoke('railops-user-admin',{body:{action,...body}});if(error)throw error;if(!data?.ok){const err=new Error(data?.code||'SERVER_ERROR');err.code=data?.code;throw err;}return data;}
function errorText(code){return ({FORBIDDEN:'Action non autorisée.',OWNER_PROTECTED:'Le compte propriétaire est protégé.',BADGE_EXISTS:'Ce matricule est déjà utilisé.',INVALID_INPUT:'Informations invalides.',PASSWORD_TOO_SHORT:'Mot de passe trop court (6 caractères minimum).',USER_NOT_AUTH_LINKED:'Ce compte doit être relié à Supabase Auth.'})[code]||'Opération refusée ou indisponible.';}
window.saveUser=async function(id){
  if(!(await hasAuthSession()))return typeof legacySaveUser==='function'?legacySaveUser(id):undefined;
  const u=userById(id);if(!u)return;
  try{const data=await invokeAdmin('update_profile',{user_id:u.id,badge:u.badge,role:u.role});if(data.user)Object.assign(u,data.user);try{localStorage.removeItem('ro3_u');}catch(e){}}
  catch(e){console.error('[RailOps secure admin] saveUser',e);notify(errorText(e.code||e.message),'danger');}
};
window.doDeleteUser=async function(id){
  if(!(await hasAuthSession()))return typeof legacyDeleteUser==='function'?legacyDeleteUser(id):undefined;
  const u=userById(id);if(!u)return;
  try{await invokeAdmin('delete_user',{user_id:id});S.users=(S.users||[]).filter(x=>String(x.id)!==String(id));document.getElementById('movl')?.remove();setTimeout(()=>{try{if(typeof openGestionComptes==='function')openGestionComptes();}catch(e){}},50);notify('Compte supprimé.','ok');}
  catch(e){console.error('[RailOps secure admin] delete user',e);notify(errorText(e.code||e.message),'danger');}
};
window.doChangePass=async function(id,selfMode){
  if(!(await hasAuthSession()))return typeof legacyChangePass==='function'?legacyChangePass(id,selfMode):undefined;
  const p1=document.getElementById('new-mdp')?.value||'';const p2=document.getElementById('new-mdp2')?.value||'';
  if(p1.length<6){notify('Mot de passe trop court (6 caractères minimum).','danger');return;}
  if(p1!==p2){notify('Les mots de passe ne correspondent pas.','danger');return;}
  const target=selfMode?selfUser()?.id:id;if(!target){notify('Compte introuvable.','danger');return;}
  try{await invokeAdmin('change_password',{user_id:target,password:p1});document.getElementById('movl')?.remove();notify('Mot de passe mis à jour ✓','ok');}
  catch(e){console.error('[RailOps secure admin] password',e);notify(errorText(e.code||e.message),'danger');}
};
console.info('[RailOps] user administration routed through secure Edge Function');
})();
