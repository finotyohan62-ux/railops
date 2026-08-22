(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.RailOpsDiagnostics150B2B=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function count(value){return Array.isArray(value)?value.length:0;}

  function createDiagnosticsSnapshot(state,runtime){
    const s=state&&typeof state==='object'?state:{};
    const r=runtime&&typeof runtime==='object'?runtime:{};
    return {
      version:r.version==null?null:String(r.version),
      role:s.role==null?null:String(s.role),
      adminOwner:!!s.isAdminOwner,
      adminMode:!!s.__ownerAdminMode,
      page:s.page==null?null:String(s.page),
      online:typeof r.online==='boolean'?r.online:null,
      counts:{
        chantiers:count(s.chantiers),
        materials:count(s.mat),
        scans:count(s.scans),
        users:count(s.users),
        chefChantierStats:count(s.chefChantierStats),
      },
    };
  }

  return {createDiagnosticsSnapshot};
});
