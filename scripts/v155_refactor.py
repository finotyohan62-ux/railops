from pathlib import Path

path = Path('index.html')
source = path.read_text(encoding='utf-8')


def replace_once(old: str, new: str, label: str) -> None:
    global source
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    source = source.replace(old, new, 1)
    print(f'OK {label}')


marker = '<script id="railops-v140-clean-engine">'
if source.count(marker) != 1:
    raise SystemExit(f'v140 insertion marker: expected exactly 1 match, found {source.count(marker)}')

lifecycle = r'''<script id="railops-v155-lifecycle">
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
</script>

'''
source = source.replace(marker, lifecycle + marker, 1)
print('OK v155 lifecycle manager inserted')

replace_once(
    "try{const oldRender=render;render=function(){const r=oldRender.apply(this,arguments);setTimeout(decorate,20);return r;};}catch(e){}",
    "window.RailOpsLifecycleV155.afterRender('v140-stable',()=>{setTimeout(decorate,20);});",
    'v140 render hook',
)
replace_once(
    "try{const oldLoad=load;load=async function(){const r=await oldLoad.apply(this,arguments);setTimeout(()=>{showRepairOffer();decorate();},700);return r;};}catch(e){}",
    "window.RailOpsLifecycleV155.afterLoad('v140-stable',()=>{setTimeout(()=>{showRepairOffer();decorate();},700);});",
    'v140 load hook',
)
replace_once(
    "  const root=document.getElementById('app')||document.body;\n  if(root){new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true});}\n  try{\n    const oldRender=window.render;\n    if(typeof oldRender==='function')window.render=function(){const r=oldRender.apply(this,arguments);setTimeout(apply,25);return r;};\n  }catch(e){}",
    "  window.RailOpsLifecycleV155.onMutation('v142-display',schedule);\n  window.RailOpsLifecycleV155.afterRender('v142-display',()=>setTimeout(apply,25));",
    'v142 render/mutation hooks',
)
replace_once(
    "try{const oldLoad145=load;load=async function(){const r=await oldLoad145.apply(this,arguments);setTimeout(offerLegacyCleanup,900);return r;};}catch(e){}",
    "window.RailOpsLifecycleV155.afterLoad('v145-cleanup',()=>{setTimeout(offerLegacyCleanup,900);});",
    'v145 load hook',
)
replace_once(
    "try{\n  const oldRender146=render;\n  render=function(){sanitizeState();const r=oldRender146.apply(this,arguments);if((st()?.mat||[]).some(safePseudo))schedule(80);return r;};\n  window.render=render;\n}catch(e){}",
    "window.RailOpsLifecycleV155.beforeRender('v146-integrity',()=>{sanitizeState();});\nwindow.RailOpsLifecycleV155.afterRender('v146-integrity',()=>{if((st()?.mat||[]).some(safePseudo))schedule(80);});",
    'v146 render hooks',
)
replace_once(
    "try{\n  const oldLoad146=load;\n  load=async function(){const r=await oldLoad146.apply(this,arguments);sanitizeState();setTimeout(()=>enforceIntegrity({silent:true}),500);return r;};\n  window.load=load;\n}catch(e){}",
    "window.RailOpsLifecycleV155.afterLoad('v146-integrity',()=>{sanitizeState();setTimeout(()=>enforceIntegrity({silent:true}),500);});",
    'v146 load hook',
)
replace_once(
    "try{\n  const oldLoad149=load;\n  load=async function(){const r=await oldLoad149.apply(this,arguments);await archiveConfirmed149({silent:true});return r;};\n  window.load=load;\n}catch(e){}",
    "window.RailOpsLifecycleV155.afterLoad('v149-archive',()=>archiveConfirmed149({silent:true}));",
    'v149 load hook',
)
replace_once(
    '<script id="railops-v154-inventory-responsible-label-fix">',
    '<script id="railops-inventory-responsible-label">',
    'inventory label script identity',
)
replace_once(
    "const VERSION='154-inventory-responsible-label-fix';",
    "const VERSION='155-inventory-label-normalizer';",
    'inventory label version',
)
replace_once(
    "try{\n  const oldRender=window.render;\n  if(typeof oldRender==='function'){\n    window.render=function(){const r=oldRender.apply(this,arguments);schedule();return r;};\n    try{render=window.render;}catch(e){}\n  }\n}catch(e){}\n\nconst root=document.getElementById('app')||document.body;\nif(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true});",
    "window.RailOpsLifecycleV155.afterRender('inventory-label',schedule);\nwindow.RailOpsLifecycleV155.onMutation('inventory-label',schedule);",
    'inventory label render/mutation hooks',
)
replace_once(
    'window.RailOpsInventoryLabel154={version:VERSION,apply:normalizeInventoryLabels};',
    'window.RailOpsInventoryLabelV155={version:VERSION,apply:normalizeInventoryLabels};',
    'inventory label public API',
)

path.write_text(source, encoding='utf-8')
print('v155 refactor written')
