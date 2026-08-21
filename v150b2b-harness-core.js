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
  return {neutralizeLegacyHtml};
});
