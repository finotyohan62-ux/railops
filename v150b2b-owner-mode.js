(function(){
'use strict';
const VERSION='150B2B-owner-mode-1';
let busy=false;
function note(msg,type='info'){try{if(typeof toast==='function')toast(msg,type);}catch(e){}}
async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data;}
function normalizeMats(rows){try{return typeof normMats==='function'?normMats(rows||[]):(rows||[]);}catch(e){return rows||[];}}

async function reloadAdmin(doRender=true){
  if(busy)return;busy=true;
  try{
    const ctx=await rpc('railops_session_context');
    if(!ctx?.ok||!ctx.is_admin_owner)throw new Error('RAILOPS_OWNER_REQUIRED');
    const [chantiers,mat,scans,users]=await Promise.all([
      rpc('railops_admin_chantiers_scope'),rpc('railops_admin_materials_scope'),rpc('railops_admin_scans_scope'),rpc('railops_user_directory')
    ]);
    S.agent=ctx.nom;
    S.isAdminOwner=true;
    S.__ownerAdminMode=true;
    S.role='admin';
    S.chantiers=chantiers||[];
    S.mat=normalizeMats(mat||[]);
    S.scans=scans||[];
    S.users=(users||[]).map(u=>({id:u.id,nom:u.nom,badge:u.badge,role:u.role,is_admin:!!u.is_admin}));
    try{S.prixCatalogue=await rpc('railops_catalogue_scope')||[];}catch(e){S.prixCatalogue=[];}
    if(doRender){S.page='dashboard';S.curC=null;S.curM=null;render();}
  }finally{busy=false;}
}

async function enterAdmin(){
  try{await reloadAdmin(true);note('Mode Administration propriétaire','ok');}
  catch(e){console.error('[RailOps owner mode] enter',e);note('Impossible d’ouvrir le mode Administration.','danger');}
}

async function exitAdmin(){
  if(busy)return;busy=true;
  try{
    S.__ownerAdminMode=false;
    S.role='chef';
    if(window.RailOpsSecurity150B2B?.reload)await window.RailOpsSecurity150B2B.reload();
    S.page='dashboard';S.curC=null;S.curM=null;
    render();
    note('Retour au mode Chef d’équipe','ok');
  }catch(e){console.error('[RailOps owner mode] exit',e);note('Impossible de revenir au mode Chef.','danger');}
  finally{busy=false;}
}

function addButton(){
  try{
    document.getElementById('ro150-owner-toggle')?.remove();
    if(!S?.agent||!S?.isAdminOwner)return;
    const top=document.querySelector('.topbar');if(!top)return;
    const b=document.createElement('button');
    b.id='ro150-owner-toggle';
    b.type='button';
    b.textContent=S.__ownerAdminMode?'← Mode Chef':'Administration';
    b.style.cssText='border:.5px solid var(--border);background:var(--bg3);color:var(--text);padding:7px 10px;border-radius:9px;font-size:11px;font-weight:600;cursor:pointer;flex-shrink:0';
    b.onclick=()=>S.__ownerAdminMode?exitAdmin():enterAdmin();
    top.appendChild(b);
  }catch(e){}
}

try{
  const prior=render;
  render=function(){const r=prior.apply(this,arguments);setTimeout(addButton,30);return r;};
  window.render=render;
}catch(e){}
setTimeout(addButton,900);

window.RailOpsOwnerMode150B2B={version:VERSION,enterAdmin,exitAdmin,reloadAdmin,isAdminMode:()=>!!S?.__ownerAdminMode};
console.info('[RailOps] mode propriétaire séparé —',VERSION);
})();