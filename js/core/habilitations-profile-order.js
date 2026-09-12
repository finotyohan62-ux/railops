(function(root){
'use strict';
if(!root||root.RailOpsHabilitationsProfileOrder)return;
const PANEL_ATTR='data-railops-habilitations-profile';
let observer=null;
let queued=false;
let profileIntentUntil=0;
let profileTriggerBridgeInstalled=false;
let directProfileHookInstalled=false;
let activeProfileHost=null;

function normalize(value){
  return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
}
function textOf(el){
  if(!el)return '';
  const attrs=['aria-label','title','placeholder'];
  return [el.textContent,el.value,...attrs.map(name=>{try{return el.getAttribute?.(name)||'';}catch(_){return '';}})].filter(Boolean).join(' ');
}
function directChildUnderHost(node,host){
  if(!node||!host||node===host)return null;
  let cur=node;
  while(cur&&cur.parentElement&&cur.parentElement!==host)cur=cur.parentElement;
  return cur?.parentElement===host?cur:null;
}
function actionableNodes(host){
  try{return [...host.querySelectorAll('button,label,input,a,[role="button"],[onclick],.btn')];}
  catch(_){return [];}
}
function findInsertionPoint(host){
  if(!host)return null;
  const nodes=actionableNodes(host);
  const security=nodes.find(el=>/(mot de passe|password|changer.*mdp|modifier.*mdp)/.test(normalize(textOf(el))));
  const securityBlock=directChildUnderHost(security,host);
  if(securityBlock)return securityBlock;
  const logout=nodes.find(el=>/(deconnexion|se deconnecter|logout)/.test(normalize(textOf(el))));
  const logoutBlock=directChildUnderHost(logout,host);
  if(logoutBlock)return logoutBlock;
  try{
    const actions=host.querySelector('.modal-actions,.msheet-actions,.sheet-actions');
    if((actions?.parentElement||actions?.parentNode)===host)return actions;
  }catch(_){}
  return null;
}
function placePanel(panel,host){
  if(!panel||!host)return false;
  const anchor=findInsertionPoint(host);
  if(!anchor||anchor===panel||(anchor.parentElement||anchor.parentNode)!==host)return false;
  host.insertBefore(panel,anchor);
  return true;
}
function currentHost(){
  try{
    const movl=document.getElementById('movl');
    if(movl)return movl.querySelector('.msheet,.modal-sheet,.modal-content,.sheet,.modal')||movl;
    const overlay=document.getElementById('modal-overlay');
    if(overlay&&overlay.children.length)return overlay.querySelector('.msheet,.modal-sheet,.modal-content,.sheet,.modal')||overlay.lastElementChild||overlay;
  }catch(_){}
  return null;
}
function profileIntentActive(){return Date.now()<=profileIntentUntil;}
function markProfileIntent(duration=2500){
  profileIntentUntil=Date.now()+Math.max(250,Number(duration)||2500);
  return profileIntentUntil;
}
function isProfileTrigger(target){
  if(!target)return false;
  try{
    if(typeof target.closest==='function'&&target.closest('[onclick*="openProfil"]'))return true;
  }catch(_){}
  let node=target;
  while(node&&node!==document){
    try{
      const handler=typeof node.getAttribute==='function'?node.getAttribute('onclick'):'';
      if(/\bopenProfil\s*\(/.test(String(handler||'')))return true;
    }catch(_){}
    node=node.parentElement||node.parentNode||null;
  }
  return false;
}
function looksLikeProfile(host){
  if(!host)return false;
  if(profileIntentActive()){
    activeProfileHost=host;
    return true;
  }
  if(activeProfileHost===host){
    if(host.isConnected===false)activeProfileHost=null;
    else return true;
  }
  const text=normalize(host.textContent||'');
  // Fallback historique : utile si le Profil a été ouvert autrement que par le bouton/avatar.
  const fallback=/(deconnexion|se deconnecter|logout)/.test(text);
  if(fallback)activeProfileHost=host;
  return fallback;
}
function currentPanel(host){
  try{return (host||document).querySelector(`[${PANEL_ATTR}]`);}catch(_){return null;}
}
function mountAndOrder(forceProfile=false){
  const host=currentHost();
  if(!host)return false;
  if(forceProfile)activeProfileHost=host;
  else if(!looksLikeProfile(host))return false;
  let panel=currentPanel(host);
  if(!panel){
    const api=root.RailOpsHabilitationsProfile;
    if(!api||typeof api.injectProfilePanel!=='function')return false;
    panel=api.injectProfilePanel(host);
  }
  if(!panel)return false;
  placePanel(panel,host);
  return true;
}
function schedule(){
  if(queued)return;
  queued=true;
  const run=()=>{queued=false;mountAndOrder();};
  if(typeof queueMicrotask==='function')queueMicrotask(run);
  else Promise.resolve().then(run);
}
function installDirectProfileHook(){
  if(directProfileHookInstalled)return true;
  const base=root.openProfil;
  if(typeof base!=='function')return false;
  if(base.__railopsHabilitationsOrderWrapped){directProfileHookInstalled=true;return true;}
  const wrapped=function(){
    const result=base.apply(this,arguments);
    mountAndOrder(true);
    return result;
  };
  wrapped.__railopsHabilitationsOrderWrapped=true;
  wrapped.__railopsHabilitationsOrderBase=base;
  root.openProfil=wrapped;
  try{openProfil=wrapped;}catch(_){}
  directProfileHookInstalled=true;
  return true;
}
function installProfileTriggerBridge(){
  if(profileTriggerBridgeInstalled)return true;
  if(typeof document==='undefined'||typeof document.addEventListener!=='function')return false;
  document.addEventListener('click',event=>{
    if(!isProfileTrigger(event?.target))return;
    markProfileIntent();
    schedule();
  },true);
  profileTriggerBridgeInstalled=true;
  return true;
}
function install(){
  // Chemin normal RailOps : legacy-core.js expose déjà openProfil quand ce module est chargé.
  // Le fallback historique n'est conservé que pour les environnements où ce hook n'existe pas.
  if(installDirectProfileHook())return true;
  installProfileTriggerBridge();
  schedule();
  if(observer||typeof MutationObserver!=='function'||!document?.body)return true;
  observer=new MutationObserver(()=>schedule());
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  return true;
}

root.RailOpsHabilitationsProfileOrder={
  findInsertionPoint,placePanel,currentHost,looksLikeProfile,mountAndOrder,schedule,install,
  isProfileTrigger,markProfileIntent,profileIntentActive,installProfileTriggerBridge,installDirectProfileHook
};
install();
})(typeof window!=='undefined'?window:this);