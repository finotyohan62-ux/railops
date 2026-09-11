(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root){root.RailOpsVisualRefresh=api;try{api.install(root.document);}catch(e){try{root.console?.warn?.('[RailOps visual refresh]',e);}catch(_){}}}
})(typeof window!=='undefined'?window:null,function(){
'use strict';

const VISUAL_REFRESH_VERSION='1.2-visual-refresh-phase3-scanner';
const STYLE_ID='ro-visual-refresh-phase1';
const CSS=`
/* VISUAL REFRESH PHASE 1 — presentation only */
#app{letter-spacing:.002em}
.screen{padding-bottom:24px}

.topbar{min-height:64px;padding:14px 16px 12px;background:var(--bg);border-bottom:1px solid var(--border);box-shadow:0 8px 24px rgba(0,0,0,.08);gap:12px}
.tbt{font-size:20px;font-weight:700;letter-spacing:-.02em}
.tbs{font-size:12px;line-height:1.35;margin-top:3px}
.tbk{min-width:40px;min-height:40px;align-items:center;justify-content:center;border-radius:12px;transition:background .15s ease,transform .15s ease}
.tbk:active{background:var(--bg3);transform:scale(.97)}

.card{border-radius:16px;padding:16px;border:1px solid var(--border);box-shadow:0 8px 24px rgba(0,0,0,.10)}
.stat-grid{gap:12px;padding:14px 16px 0}
.stat-card{border-radius:16px;padding:16px;border:1px solid var(--border);box-shadow:0 8px 24px rgba(0,0,0,.09)}
.sv{font-size:28px;font-weight:750;letter-spacing:-.035em;line-height:1.05}
.sl{font-size:11px;line-height:1.35;margin-top:5px}
.cc{border-radius:16px;padding:16px;border:1px solid var(--border);box-shadow:0 8px 24px rgba(0,0,0,.09);transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}
.cc:active{transform:scale(.99);box-shadow:0 4px 14px rgba(0,0,0,.08)}
.reg-item{border-radius:18px;padding:15px 15px 15px 18px;border:1px solid var(--border);box-shadow:0 7px 20px rgba(0,0,0,.08);position:relative;overflow:hidden;margin-bottom:10px;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease}

/* VISUAL REFRESH PHASE 2 — inventory and material cards */
.reg-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--border)}
.reg-item.present::before{background:var(--success)}
.reg-item.non-confirme::before{background:var(--accent)}
.reg-item.absent::before{background:var(--danger)}
.reg-item.present{border-color:rgba(29,158,117,.22)}
.reg-item.non-confirme{border-color:rgba(244,121,32,.28)}
.reg-item.absent{border-color:rgba(226,75,74,.40);background:linear-gradient(90deg,rgba(226,75,74,.055),var(--bg2) 34%)}
.reg-item:active{transform:scale(.992);box-shadow:0 4px 13px rgba(0,0,0,.07)}
.reg-top{min-height:44px;display:flex;align-items:center;gap:12px}
.reg-item .it{font-size:15px;font-weight:750;letter-spacing:-.01em;line-height:1.2}
.reg-item .is{font-size:11px;line-height:1.35;margin-top:4px;color:var(--text2)}
.reg-item .badge{padding:5px 9px;font-weight:700}
.reg-item .ic{width:42px;height:42px;border-radius:13px;background:var(--bg3)}
.reg-body{margin-top:12px;border-radius:12px;padding:10px;border-top:0;background:var(--bg3);display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.reg-body .badge{background:var(--bg2);border:1px solid var(--border)}
.ps-ok,.ps-warn,.ps-absent{width:34px;height:34px;border:1px solid var(--border);box-shadow:inset 0 0 0 1px rgba(255,255,255,.02)}
.ps-ok{background:rgba(29,158,117,.14)}
.ps-warn{background:rgba(244,121,32,.12)}
.ps-absent{background:rgba(226,75,74,.14)}
.avatar{width:38px;height:38px;border-radius:12px;font-size:12px;font-weight:750}

/* VISUAL REFRESH PHASE 3 — scanner */
.cam-wrap{border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.22);margin:12px 16px 0;border:1px solid rgba(255,255,255,.07);min-height:280px;background:#07090d}
#cam-video{min-height:280px;object-fit:cover;width:100%;max-height:340px;display:block}
.scan-overlay{padding:18px;box-sizing:border-box;background:radial-gradient(circle at center,transparent 0,transparent 38%,rgba(0,0,0,.12) 68%,rgba(0,0,0,.30) 100%)}
.scan-frame{width:210px;height:210px;filter:drop-shadow(0 8px 24px rgba(0,0,0,.28))}
.scan-frame::before,.scan-frame::after{width:42px;height:42px;border-color:var(--accent);border-style:solid}
.scan-frame::before{border-width:4px 0 0 4px;border-radius:8px 0 0 0}
.scan-frame::after{border-width:0 4px 4px 0;border-radius:0 0 8px 0}
.sftr,.sfbl{width:42px;height:42px;border-color:var(--accent);border-style:solid}
.sftr{border-width:4px 4px 0 0;border-radius:0 8px 0 0}
.sfbl{border-width:0 0 4px 4px;border-radius:0 0 0 8px}
.scan-beam{height:3px;box-shadow:0 0 12px rgba(244,121,32,.90),0 0 28px rgba(244,121,32,.34);left:12px;right:12px;border-radius:999px}
.scan-hint{min-height:36px;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:8px 14px;border-radius:999px;background:rgba(8,10,14,.66);border:1px solid rgba(255,255,255,.12);font-size:12px;font-weight:600;color:rgba(255,255,255,.92);box-shadow:0 8px 20px rgba(0,0,0,.18)}

.btn{min-height:48px;padding:12px 18px;border-radius:14px;font-size:14px;font-weight:650;letter-spacing:.005em;transition:transform .12s ease,opacity .12s ease,box-shadow .15s ease}
.btn:active{opacity:.9;transform:scale(.985)}
.btn-accent{box-shadow:0 8px 20px rgba(244,121,32,.18)}
.fi{min-height:46px;border-radius:13px;padding:11px 14px;border:1px solid var(--border);background:var(--bg2)}
.fi:focus{box-shadow:0 0 0 3px rgba(244,121,32,.10)}
.ro{min-height:44px;border-radius:13px;padding:11px 12px}
.tgl-row{border-radius:14px;padding:13px 14px}

.sec{padding:18px 16px 9px;font-size:10px;font-weight:700;letter-spacing:.11em}
.li{padding:13px 0;gap:13px}
.ic{width:40px;height:40px;border-radius:12px}
.it{font-size:14px;font-weight:650}
.is{font-size:11px;margin-top:3px}
.badge{font-size:10px;font-weight:650;padding:4px 8px}
.chips{gap:8px;padding:12px 16px 2px}
.chip{padding:7px 12px;border-radius:999px;font-size:11px;font-weight:550}
.tabs{gap:6px;margin-top:14px}
.tab{min-height:40px;padding:10px 7px;border-radius:12px;font-weight:600}

.bnav{padding:7px 8px env(safe-area-inset-bottom,12px);gap:4px;border-top:1px solid var(--border);box-shadow:0 -10px 26px rgba(0,0,0,.12)}
.ni{min-height:48px;border-radius:12px;gap:4px;padding:5px 2px;transition:transform .12s ease,background .15s ease}
.ni:active{transform:scale(.97);background:var(--bg3)}
.ni svg{width:21px;height:21px;stroke-width:1.9}
.nl{font-size:10px;font-weight:550}
.ni.active .nl{font-weight:700}

.msheet{border-radius:24px 24px 0 0;padding:16px 16px 34px;box-shadow:0 -18px 44px rgba(0,0,0,.24)}
.mhandle{width:42px;height:5px;border-radius:999px;margin-bottom:18px}
.alert-box{border-radius:14px;padding:11px 14px}
.fab{width:52px;height:52px;bottom:82px;right:18px;box-shadow:0 10px 24px rgba(244,121,32,.28)}
.fab svg{width:22px;height:22px}
.pbar{height:6px;border-radius:999px}

#ro-sync-status-wrap{padding:10px 16px 2px!important}
#ro-sync-status{padding:7px 11px!important;border-radius:999px!important;font-size:11px!important;font-weight:650!important}
#ro-sync-attention{margin:8px 16px 2px!important;padding:10px 12px!important;border-radius:13px!important;font-size:11px!important}

@media (max-width:380px){
  .topbar{min-height:60px;padding-left:14px;padding-right:14px}
  .tbt{font-size:18px}
  .stat-grid{padding-left:14px;padding-right:14px;gap:10px}
  .stat-card{padding:14px}
  .sv{font-size:25px}
  .reg-item{padding:13px 13px 13px 16px;border-radius:16px}
  .reg-top{gap:10px}
  .reg-item .it{font-size:14px}
  .reg-body{padding:9px;gap:8px}
  .cam-wrap{margin-left:12px;margin-right:12px;border-radius:16px;min-height:250px}
  #cam-video{min-height:250px}
  .scan-frame{width:180px;height:180px}
  .scan-hint{min-height:34px;font-size:11px;padding:7px 12px}
}

@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
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

return {VISUAL_REFRESH_VERSION,version:VISUAL_REFRESH_VERSION,STYLE_ID,CSS,install,destroy};
});
