(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.RailOpsHarness150B2B=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function neutralizeLegacyHtml(input){
    const htmlInput=String(input??'');
    const start=htmlInput.indexOf('async function load(){');
    const marker='}function eL(';
    const end=start>=0?htmlInput.indexOf(marker,start):-1;
    if(start<0||end<0)throw new Error('LEGACY_BOOTSTRAP_NOT_FOUND');

    let html=htmlInput.slice(0,start)+'async function load(){return;}function eL('+htmlInput.slice(end+marker.length);
    const silentMarker='async function silentSync(){';
    if(!html.includes(silentMarker))throw new Error('LEGACY_SILENT_SYNC_NOT_FOUND');
    html=html.replace(silentMarker,silentMarker+'return;');
    return html;
  }
  function escapeHtml(value){
    return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  }
  function formatLoadErrorHtml(error){
    const message=escapeHtml(error&&error.message||error||'Erreur inconnue');
    return '<main style="font:16px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;min-height:100dvh;box-sizing:border-box;background:#0f1117;padding-top:max(20px,env(safe-area-inset-top));padding-bottom:max(20px,env(safe-area-inset-bottom));padding-left:max(20px,env(safe-area-inset-left));padding-right:max(20px,env(safe-area-inset-right));color:#f0f0f0">'
      +'<div role="alert" aria-live="assertive" style="max-width:680px;margin:28px auto 0;background:#1a1d26;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:20px">'
      +'<strong style="display:block;margin-bottom:8px">Impossible de charger RailOps v150B-2B</strong>'
      +'<code style="display:block;overflow-wrap:anywhere;color:#c6cad4">'+message+'</code>'
      +'<button type="button" onclick="location.reload()" style="margin-top:18px;padding:10px 14px;border:0;border-radius:10px;cursor:pointer">Réessayer</button>'
      +'</div></main>';
  }
  return {neutralizeLegacyHtml,formatLoadErrorHtml};
});
