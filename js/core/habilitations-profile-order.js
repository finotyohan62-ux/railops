(function(root){
'use strict';
if(!root||root.RailOpsHabilitationsProfileOrder)return;
const PANEL_ATTR='data-railops-habilitations-profile';
let observer=null;
let queued=false;

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
function looksLikeProfile(host){
  if(!host)return false;
  const text=normalize(host.textContent||'');
  const logout=/(deconnexion|se deconnecter|logout)/.test(text);
  const account=/(mot de passe|password|profil|compte)/.test(text);
  return logout&&account;
}
function currentPanel(host){
  try{return (host||document).querySelector(`[${PANEL_ATTR}]`);}catch(_){return null;}
}
function mountAndOrder(){
  const host=currentHost();
  if(!looksLikeProfile(host))return false;
  let panel=currentPanel(host);
  if(!panel){
    const api=root.RailOpsHabilitationsProfile;
    if(!api||typeof api.injectProfilePanel!=='function')return false;
    panel=api.injectProfilePanel();
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
function install(){
  schedule();
  if(observer||typeof MutationObserver!=='function'||!document?.body)return true;
  observer=new MutationObserver(()=>schedule());
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  return true;
}

root.RailOpsHabilitationsProfileOrder={
  findInsertionPoint,placePanel,currentHost,looksLikeProfile,mountAndOrder,schedule,install
};
install();
})(typeof window!=='undefined'?window:this);
