(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root){root.RailOpsVisualFinishing=api;try{api.install(root.document);}catch(e){try{root.console?.warn?.('[RailOps visual finishing]',e);}catch(_){}}}
})(typeof window!=='undefined'?window:null,function(){
'use strict';

const VISUAL_FINISHING_VERSION='1.5-visual-refresh-phase6-finishing';
const STYLE_ID='ro-visual-finishing-phase6';
const CSS=`
/* VISUAL REFRESH PHASE 6 — finishing and global polish */
.moverlay{backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);background:rgba(7,9,13,.66)}
.msheet{border:1px solid var(--border);border-bottom:0;background:var(--bg2)}
.mhandle{background:var(--bg4);opacity:.9}

.alert-box{min-height:44px;border:1px solid var(--border);box-shadow:0 6px 18px rgba(0,0,0,.07);padding:11px 14px;border-radius:14px}
.a-danger{background:linear-gradient(90deg,rgba(226,75,74,.11),rgba(226,75,74,.055))}
.a-warn{background:linear-gradient(90deg,rgba(244,121,32,.12),rgba(244,121,32,.05))}
.a-ok{background:linear-gradient(90deg,rgba(29,158,117,.11),rgba(29,158,117,.05))}
.at{line-height:1.4;font-weight:600}

.chips{scroll-snap-type:x proximity;scroll-padding-inline:16px;gap:8px;padding-bottom:4px}
.chip{min-height:36px;display:inline-flex;align-items:center;justify-content:center;scroll-snap-align:start;padding:7px 13px;border-radius:999px;border:1px solid var(--border);font-weight:600;transition:transform .12s ease,background .15s ease,border-color .15s ease}
.chip:active{transform:scale(.97)}
.chip.on{box-shadow:0 5px 14px rgba(244,121,32,.14)}

.tabs{gap:7px}
.tab{min-height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);transition:transform .12s ease,background .15s ease,border-color .15s ease}
.tab:active{transform:scale(.98)}
.tab.on{box-shadow:0 5px 14px rgba(244,121,32,.13)}

.empty-state{text-align:center;border:1px dashed var(--border);border-radius:16px;padding:24px 18px;margin:14px 16px;background:var(--bg2);color:var(--text2);line-height:1.45}
.empty-state .ic{margin:0 auto 10px;width:44px;height:44px;border-radius:14px;background:var(--bg3)}
.empty-state .it{white-space:normal;overflow:visible;text-overflow:clip;font-size:14px;font-weight:700;color:var(--text)}
.empty-state .is{white-space:normal;overflow:visible;text-overflow:clip;margin-top:5px;line-height:1.45}

.badge{border:1px solid transparent}
.card,.stat-card,.reg-item,.cc,.msheet{background-clip:padding-box}
.fi::placeholder{color:var(--text3);opacity:.9}
.fi:focus-visible,.btn:focus-visible,.chip:focus-visible,.tab:focus-visible,.ni:focus-visible,.tbk:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

@media (min-width:700px){
  .msheet{width:min(720px,100%);margin-left:auto;margin-right:auto}
}

@media (max-width:380px){
  .alert-box{min-height:42px;padding:10px 12px}
  .chip{min-height:34px;padding-left:11px;padding-right:11px}
  .empty-state{margin-left:12px;margin-right:12px;padding:20px 14px}
}
`;

function install(doc){
  if(!doc||doc.getElementById(STYLE_ID))return false;
  const style=doc.createElement('style');
  style.id=STYLE_ID;
  style.textContent=CSS;
  (doc.head||doc.documentElement).appendChild(style);
  return true;
}

function destroy(doc){
  if(!doc)return false;
  const node=doc.getElementById(STYLE_ID);
  if(!node)return false;
  node.remove();
  return true;
}

return {VISUAL_FINISHING_VERSION,version:VISUAL_FINISHING_VERSION,STYLE_ID,CSS,install,destroy};
});
