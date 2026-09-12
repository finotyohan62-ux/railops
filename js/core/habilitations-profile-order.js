(function(root){
'use strict';
if(!root||root.RailOpsHabilitationsProfileOrder)return;
const PANEL_ATTR='data-railops-habilitations-profile';

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
function currentPanel(){
  try{return document.querySelector(`[${PANEL_ATTR}]`);}catch(_){return null;}
}
function reorder(){
  const panel=currentPanel();
  const host=panel?.parentElement;
  if(!panel||!host)return false;
  return placePanel(panel,host);
}
function schedule(){[0,40,120,300,700].forEach(delay=>setTimeout(reorder,delay));}
function install(){
  const base=root.openProfil;
  if(typeof base!=='function')return false;
  if(!base.__railopsProfileOrderWrapped){
    const wrapped=function(){const result=base.apply(this,arguments);schedule();return result;};
    wrapped.__railopsProfileOrderWrapped=true;
    wrapped.__railopsProfileOrderBase=base;
    root.openProfil=wrapped;
    try{openProfil=wrapped;}catch(_){}
  }
  schedule();
  return true;
}

root.RailOpsHabilitationsProfileOrder={findInsertionPoint,placePanel,reorder,schedule,install};
if(!install())setTimeout(install,100);
})(typeof window!=='undefined'?window:this);
