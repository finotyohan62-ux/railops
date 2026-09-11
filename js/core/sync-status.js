(function(root,factory){
'use strict';
const core=factory();
if(typeof module==='object'&&module.exports)module.exports=core;
if(root){
  const api=core.createBrowserApi(root);
  root.RailOpsSyncStatusUI=api;
  try{api.install();}catch(e){try{root.console?.warn?.('[RailOps sync status] installation',e);}catch(_){} }
}
})(typeof window!=='undefined'?window:null,function(){
'use strict';

const VERSION='1.0-sync-status-ui';
const OFFLINE_KEY='ro_offline_queue';

function safeQueue(raw){
  if(Array.isArray(raw))return raw.slice();
  if(typeof raw!=='string'||!raw.trim())return [];
  try{const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed:[];}catch(e){return [];}
}

function pendingMaterialIds(queue){
  const seen=new Set(),out=[];
  for(const item of safeQueue(queue)){
    const data=item&&typeof item==='object'?item.data:null;
    const id=String(data?.materielId??data?.id??'').trim();
    if(!id||seen.has(id))continue;
    seen.add(id);out.push(id);
  }
  return out;
}

function plural(n,singular,pluralForm){return n===1?singular:(pluralForm||singular+'s');}

function deriveStatus(input){
  const cfg=input||{};
  const queue=safeQueue(cfg.queue);
  const pending=queue.length;
  const online=cfg.online!==false;
  const error=String(cfg.error||'').trim();
  if(!online){
    return {
      state:'offline',pending,online:false,
      label:pending?`Hors ligne · ${pending} en attente`:'Hors ligne',
      attention:pending?`${pending} ${plural(pending,'action','actions')} ${plural(pending,'est','sont')} conservée${pending===1?'':'s'} sur cet appareil.`:''
    };
  }
  if(error){
    return {state:'error',pending,online:true,label:'Erreur de synchronisation',attention:error};
  }
  if(pending){
    return {
      state:'pending',pending,online:true,
      label:`${pending} en attente`,
      attention:`${pending} ${plural(pending,'action','actions')} en attente d’envoi. ${pending===1?'Elle reste conservée':'Elles restent conservées'} sur cet appareil.`
    };
  }
  return {state:'synced',pending:0,online:true,label:'Synchronisé',attention:''};
}

function createBrowserApi(win){
  const doc=win?.document;
  let installed=false,observer=null,timer=null,refreshTimer=null,explicitError='';

  function readQueue(){
    try{return safeQueue(win.localStorage?.getItem?.(OFFLINE_KEY)||'[]');}catch(e){return [];}
  }
  function state(){
    return deriveStatus({online:win.navigator?.onLine!==false,queue:readQueue(),error:explicitError});
  }
  function addStyles(){
    if(!doc||doc.getElementById('ro-sync-status-style'))return;
    const style=doc.createElement('style');style.id='ro-sync-status-style';
    style.textContent=`
#ro-sync-status-wrap{display:flex;align-items:center;justify-content:flex-start;padding:0 16px 9px;box-sizing:border-box}
#ro-sync-status{appearance:none;border:1px solid var(--border);background:var(--bg2);color:var(--text2);border-radius:999px;padding:6px 10px;display:inline-flex;align-items:center;gap:7px;font:inherit;font-size:10px;font-weight:650;line-height:1;cursor:default;box-shadow:none}
#ro-sync-status .ro-sync-dot{width:7px;height:7px;border-radius:50%;display:block;flex:0 0 7px;background:#8a8f98}
#ro-sync-status[data-state="synced"]{border-color:rgba(29,158,117,.30);background:rgba(29,158,117,.08);color:#1d9e75}
#ro-sync-status[data-state="synced"] .ro-sync-dot{background:#1d9e75;box-shadow:0 0 0 3px rgba(29,158,117,.10)}
#ro-sync-status[data-state="pending"]{border-color:rgba(240,160,34,.35);background:rgba(240,160,34,.10);color:#c47c0b}
#ro-sync-status[data-state="pending"] .ro-sync-dot{background:#f0a022}
#ro-sync-status[data-state="offline"]{border-color:var(--border);background:var(--bg3);color:var(--text3)}
#ro-sync-status[data-state="offline"] .ro-sync-dot{background:#8a8f98}
#ro-sync-status[data-state="error"]{border-color:rgba(226,75,74,.40);background:rgba(226,75,74,.10);color:#e24b4a}
#ro-sync-status[data-state="error"] .ro-sync-dot{background:#e24b4a}
#ro-sync-attention{margin:0 16px 10px;padding:9px 11px;border-radius:10px;font-size:10px;line-height:1.35;box-sizing:border-box;border:1px solid rgba(240,160,34,.30);background:rgba(240,160,34,.08);color:var(--text2)}
#ro-sync-attention[data-state="offline"]{border-color:var(--border);background:var(--bg3)}
#ro-sync-attention[data-state="error"]{border-color:rgba(226,75,74,.35);background:rgba(226,75,74,.08);color:#e24b4a}
`;
    (doc.head||doc.documentElement).appendChild(style);
  }
  function removeOwned(){
    doc?.getElementById('ro-sync-status-wrap')?.remove();
    doc?.getElementById('ro-sync-attention')?.remove();
  }
  function ensureStatus(topbar){
    let wrap=doc.getElementById('ro-sync-status-wrap');
    if(!wrap){
      wrap=doc.createElement('div');wrap.id='ro-sync-status-wrap';
      const chip=doc.createElement('div');chip.id='ro-sync-status';chip.setAttribute('role','status');chip.setAttribute('aria-live','polite');
      const dot=doc.createElement('span');dot.className='ro-sync-dot';dot.setAttribute('aria-hidden','true');
      const label=doc.createElement('span');label.className='ro-sync-label';
      chip.append(dot,label);wrap.appendChild(chip);
    }
    if(wrap.previousElementSibling!==topbar)topbar.insertAdjacentElement('afterend',wrap);
    return wrap.querySelector('#ro-sync-status');
  }
  function ensureAttention(afterNode){
    let box=doc.getElementById('ro-sync-attention');
    if(!box){box=doc.createElement('div');box.id='ro-sync-attention';box.setAttribute('role','status');box.setAttribute('aria-live','polite');}
    if(box.previousElementSibling!==afterNode)afterNode.insertAdjacentElement('afterend',box);
    return box;
  }
  function refresh(){
    if(!doc)return null;
    addStyles();
    const app=doc.getElementById('app');
    const topbar=app?.querySelector?.('.topbar');
    if(!app||!topbar){removeOwned();return null;}
    const current=state();
    const chip=ensureStatus(topbar);
    const signature=`${current.state}|${current.pending}|${current.label}`;
    if(chip.dataset.signature!==signature){
      chip.dataset.signature=signature;chip.dataset.state=current.state;
      const label=chip.querySelector('.ro-sync-label');if(label)label.textContent=current.label;
      chip.title=current.pending?`${current.pending} action(s) locale(s) non encore confirmée(s) par le serveur`:current.label;
    }
    const wrap=doc.getElementById('ro-sync-status-wrap');
    if(current.attention){
      const box=ensureAttention(wrap);const attentionSignature=`${current.state}|${current.attention}`;
      if(box.dataset.signature!==attentionSignature){box.dataset.signature=attentionSignature;box.dataset.state=current.state;box.textContent=current.attention;}
    }else doc.getElementById('ro-sync-attention')?.remove();
    return current;
  }
  function scheduleRefresh(){
    if(refreshTimer)return;
    refreshTimer=win.setTimeout(()=>{refreshTimer=null;refresh();},25);
  }
  function install(){
    if(installed||!doc)return api;
    installed=true;addStyles();refresh();
    win.addEventListener('online',scheduleRefresh);
    win.addEventListener('offline',scheduleRefresh);
    win.addEventListener('storage',ev=>{if(!ev||ev.key===OFFLINE_KEY)scheduleRefresh();});
    const app=doc.getElementById('app');
    if(app&&typeof win.MutationObserver==='function'){
      observer=new win.MutationObserver(scheduleRefresh);
      observer.observe(app,{childList:true,subtree:true,attributes:true,characterData:true});
    }
    timer=win.setInterval(refresh,2000);
    return api;
  }
  function setError(message){explicitError=String(message||'').trim();refresh();}
  function clearError(){explicitError='';refresh();}
  function destroy(){
    if(!installed)return;installed=false;
    if(observer)observer.disconnect();observer=null;
    if(timer)win.clearInterval(timer);timer=null;
    if(refreshTimer)win.clearTimeout(refreshTimer);refreshTimer=null;
    removeOwned();
  }
  function isPendingMaterial(id){return pendingMaterialIds(readQueue()).includes(String(id??'').trim());}
  const api={version:VERSION,install,refresh,state,readQueue,isPendingMaterial,pendingMaterialIds:()=>pendingMaterialIds(readQueue()),setError,clearError,destroy};
  return api;
}

return {VERSION,version:VERSION,OFFLINE_KEY,safeQueue,pendingMaterialIds,deriveStatus,createBrowserApi};
});
