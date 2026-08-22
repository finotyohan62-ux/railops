(function(){
'use strict';
const VERSION='150B2B-secure-delete-1';
function msg(text,type='info'){try{if(typeof toast==='function')toast(text,type);}catch(e){}}
async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data;}
async function secureDelete(id){return await rpc('railops_delete_material',{p_id:String(id)});}
function removeLocal(id){S.mat=(S.mat||[]).filter(m=>String(m.id)!==String(id));S.scans=(S.scans||[]).filter(s=>String(s.materielId)!==String(id));try{localStorage.setItem('ro3_m',JSON.stringify(S.mat||[]));localStorage.setItem('ro3_s',JSON.stringify(S.scans||[]));}catch(e){}}

safeDeleteMat=async function(id){try{await secureDelete(id);return true;}catch(e){console.warn('[RailOps v150B-2B] delete material',id,e);return false;}};
window.safeDeleteMat=safeDeleteMat;

flushDeleteQueue=async function(){
  const ids=typeof getDeleteQueue==='function'?(getDeleteQueue()||[]):[];
  if(!ids.length||!navigator.onLine)return;
  for(const id of [...ids]){
    try{await secureDelete(id);if(typeof dequeueDelete==='function')dequeueDelete(id);removeLocal(id);}catch(e){console.warn('[RailOps v150B-2B] delete queue',id,e);}
  }
};
window.flushDeleteQueue=flushDeleteQueue;

doRetirer=async function(id,motif,prix){
  window._importing=true;
  try{
    const m=(S.mat||[]).find(x=>String(x.id)===String(id));
    const key='ro3_retraits';
    try{
      const rows=JSON.parse(localStorage.getItem(key)||'[]');
      rows.push({id,nom:m?.nom||id,motif:motif||'fin_de_vie',prix:prix||0,date:(typeof nowISO==='function'?nowISO():new Date().toISOString()),chantier:S.curC});
      localStorage.setItem(key,JSON.stringify(rows));
    }catch(e){}
    if(typeof queueDelete==='function')queueDelete(id);
    removeLocal(id);
    if(navigator.onLine){try{await secureDelete(id);if(typeof dequeueDelete==='function')dequeueDelete(id);}catch(e){console.warn('[RailOps v150B-2B] retrait en attente',id,e);}}
    S.modal=null;S.modalData=null;
    try{if(typeof renderChantierDetail==='function')renderChantierDetail();else if(typeof renderTab==='function')renderTab();}catch(e){}
    msg('Article retiré du chantier','ok');
  }finally{window._importing=false;window._lastImport=Date.now();}
};
window.doRetirer=doRetirer;

doDeleteSelected=async function(ids){
  if(!ids||!ids.length)ids=[...(S.selItems||[])];
  ids=[...new Set((ids||[]).map(String).filter(Boolean))];
  if(!ids.length)return;
  window._importing=true;
  try{
    for(const id of ids)if(typeof queueDelete==='function')queueDelete(id);
    for(const id of ids)removeLocal(id);
    S.selItems=new Set();S.selMode=false;
    if(navigator.onLine){
      for(const id of ids){try{await secureDelete(id);if(typeof dequeueDelete==='function')dequeueDelete(id);}catch(e){console.warn('[RailOps v150B-2B] suppression groupée en attente',id,e);}}
    }
    document.getElementById('movl')?.remove();
    try{if(typeof renderTab==='function')renderTab();}catch(e){}
    msg(`${ids.length} article(s) supprimé(s)`,'warn');
  }finally{window._importing=false;window._lastImport=Date.now();}
};
window.doDeleteSelected=doDeleteSelected;

window.RailOpsSecureDelete150B2B={version:VERSION,flush:flushDeleteQueue};
console.info('[RailOps] suppressions sécurisées —',VERSION);
})();