
(function(){
'use strict';
if(window.RailOpsLifecycleV155)return;
const VERSION='155-lifecycle-cleanup';
const beforeRenderHandlers=new Map();
const afterRenderHandlers=new Map();
const afterLoadHandlers=new Map();
const mutationHandlers=new Map();

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
    const result=await baseLoadV155.apply(this,arguments);
    await runAsync(afterLoadHandlers,this,arguments);
    return result;
  };
  window.load=sharedLoadV155;
  try{load=sharedLoadV155;}catch(e){}
}

const mutationRootV155=document.getElementById('app')||document.body;
if(mutationRootV155){
  const observerV155=new MutationObserver(mutations=>runSync(mutationHandlers,null,[mutations]));
  observerV155.observe(mutationRootV155,{childList:true,subtree:true,characterData:true});
}

console.info('[RailOps] cycle partagé actif —',VERSION);
})();
