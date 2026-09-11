(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root){root.RailOpsVisualFinishing=api;try{api.install(root.document);}catch(e){try{root.console?.warn?.('[RailOps visual finishing]',e);}catch(_){}}}
})(typeof window!=='undefined'?window:null,function(){
'use strict';

const VISUAL_FINISHING_VERSION='1.5-visual-refresh-phase6-finishing';
const VISUAL_AUDIT_VERSION='1.6-visual-audit-legacy-surfaces';
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

/* VISUAL AUDIT — legacy surfaces */
.ro144-sheet{border-radius:24px 24px 0 0;box-shadow:0 -18px 44px rgba(0,0,0,.24);padding:18px 16px 34px}
.ro144-title{font-size:20px;font-weight:750;letter-spacing:-.02em;line-height:1.2}
.ro144-sub{font-size:11px;line-height:1.45;margin:5px 0 14px;color:var(--text2)}
.ro144-source,.ro144-maprow,.ro144-hist{border:1px solid var(--border);border-radius:14px;padding:11px 12px;background:var(--bg3);box-shadow:0 5px 14px rgba(0,0,0,.05)}
.ro144-maprow{margin-bottom:8px}
.ro144-maprow>div{min-height:24px;margin-bottom:7px}
.ro144-maprow .fi{min-height:44px;border-radius:12px;background:var(--bg2)}
.ro144-kpis{gap:8px;margin:12px 0}
.ro144-kpis>div{border:1px solid var(--border);border-radius:14px;padding:11px 8px;background:var(--bg3);box-shadow:0 4px 12px rgba(0,0,0,.04)}
.ro144-kpis b{font-size:19px;letter-spacing:-.02em}
.ro144-kpis span{font-size:9px;line-height:1.25}
.ro144-note,.ro144-targets,.ro144-okbox,.ro144-errorbox{border-radius:14px;padding:11px 12px;line-height:1.45}
.ro144-note,.ro144-targets{border:1px solid var(--border);background:var(--bg3)}
.ro144-okbox{border:1px solid rgba(29,158,117,.34);background:linear-gradient(90deg,rgba(29,158,117,.11),rgba(29,158,117,.05))}
.ro144-errorbox{border:1px solid rgba(226,75,74,.34);background:linear-gradient(90deg,rgba(226,75,74,.11),rgba(226,75,74,.05))}
.ro144-details{border:1px solid var(--border);border-radius:12px;padding:9px 11px;background:var(--bg3)}
.ro-v142-mc{border-radius:999px!important;font-weight:700!important;padding:5px 9px!important;margin-top:8px!important;background:rgba(244,121,32,.12)!important;border:1px solid rgba(244,121,32,.30)!important;color:var(--accent)!important;line-height:1.3!important;box-shadow:0 4px 12px rgba(244,121,32,.08)}

.ro147-wrap,.ro148-wrap{padding:14px 16px 96px}
.ro147-summary,.ro147-big,.ro148-summary,.ro148-big{gap:10px;margin-bottom:12px}
.ro147-summary>div,.ro147-big>div,.ro148-summary>div,.ro148-big>div{border:1px solid var(--border);border-radius:16px;padding:14px;background:var(--bg2);box-shadow:0 7px 20px rgba(0,0,0,.07)}
.ro147-summary strong,.ro147-big strong,.ro148-summary strong,.ro148-big strong{font-size:24px;font-weight:750;letter-spacing:-.03em}
.ro147-info,.ro148-note{border:1px solid rgba(55,138,221,.22);border-radius:14px;padding:11px 13px;line-height:1.45;background:linear-gradient(90deg,rgba(55,138,221,.10),rgba(55,138,221,.045));box-shadow:0 5px 14px rgba(0,0,0,.04)}
.ro147-section,.ro148-title{margin:17px 2px 9px;font-weight:750;letter-spacing:.10em}
.ro147-card{border:1px solid var(--border);border-radius:16px;padding:15px;margin-bottom:10px;box-shadow:0 7px 20px rgba(0,0,0,.07);position:relative;overflow:hidden;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease}
.ro147-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--accent)}
.ro147-card:active{transform:scale(.992);border-color:rgba(244,121,32,.32);box-shadow:0 4px 13px rgba(0,0,0,.06)}
.ro147-name{font-size:15px;font-weight:750;letter-spacing:-.01em;line-height:1.22}
.ro147-sub{font-size:10px;line-height:1.4;margin-top:4px}
.ro147-total{padding:5px 9px;font-weight:700;border:1px solid var(--border)}
.ro147-track,.ro148-track{height:6px}
.ro147-prog-head,.ro148-prog-h{font-size:10px;margin-bottom:5px}

.ro148-group{margin-bottom:16px}
.ro148-group-h{border:1px solid var(--border);border-radius:16px;padding:11px 12px;margin-bottom:9px;box-shadow:0 6px 18px rgba(0,0,0,.06)}
.ro148-group-h strong{font-size:13px;font-weight:750}
.ro148-group-h span{font-size:10px;line-height:1.35}
.ro148-avatar{width:38px;height:38px;border-radius:12px;font-size:11px;background:var(--bg3);box-shadow:0 5px 14px rgba(244,121,32,.12)}
.ro148-card{border:1px solid var(--border);border-radius:16px;padding:14px 15px;margin-bottom:9px;box-shadow:0 7px 20px rgba(0,0,0,.07);position:relative;overflow:hidden;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease}
.ro148-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--accent)}
.ro148-card:active{transform:scale(.992);border-color:rgba(244,121,32,.32);box-shadow:0 4px 13px rgba(0,0,0,.06)}
.ro148-name{font-size:14px;font-weight:750;letter-spacing:-.01em;line-height:1.22}
.ro148-sub{font-size:10px;line-height:1.4;margin-top:4px}
.ro148-count{padding:5px 9px;font-size:10px;font-weight:700;border:1px solid var(--border)}
.ro147-back,.ro148-back{min-width:40px;min-height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:0;color:var(--text2);transition:background .15s ease,transform .12s ease}
.ro147-back:active,.ro148-back:active{background:var(--bg3);transform:scale(.97)}
.ro147-empty,.ro148-empty{border:1px dashed var(--border);border-radius:16px;padding:24px 16px;margin:12px 0;background:var(--bg2);color:var(--text2);line-height:1.45;text-align:center}

@media (min-width:700px){
  .msheet{width:min(720px,100%);margin-left:auto;margin-right:auto}
}

@media (max-width:380px){
  .alert-box{min-height:42px;padding:10px 12px}
  .chip{min-height:34px;padding-left:11px;padding-right:11px}
  .empty-state{margin-left:12px;margin-right:12px;padding:20px 14px}
  .ro144-sheet{padding-left:14px;padding-right:14px}
  .ro144-kpis{grid-template-columns:repeat(2,1fr)}
  .ro147-wrap,.ro148-wrap{padding-left:12px;padding-right:12px}
  .ro147-card,.ro148-card{border-radius:15px;padding:13px 13px 13px 15px}
  .ro147-summary>div,.ro147-big>div,.ro148-summary>div,.ro148-big>div{padding:12px}
  .ro147-summary strong,.ro147-big strong,.ro148-summary strong,.ro148-big strong{font-size:21px}
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

return {VISUAL_FINISHING_VERSION,VISUAL_AUDIT_VERSION,version:VISUAL_AUDIT_VERSION,STYLE_ID,CSS,install,destroy};
});
