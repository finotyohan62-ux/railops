(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.RailOpsDiagnostics150B2B=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function count(value){return Array.isArray(value)?value.length:0;}

  function createDiagnosticsSnapshot(state,runtime){
    const s=state&&typeof state==='object'?state:{};
    const r=runtime&&typeof runtime==='object'?runtime:{};
    const snapshot={
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
    const warnings=[];
    if(snapshot.role==='chef_chantier'&&snapshot.counts.materials>0)warnings.push('CHEF_CHANTIER_MATERIAL_SCOPE_LEAK');
    if(snapshot.role==='chef_chantier'&&snapshot.counts.scans>0)warnings.push('CHEF_CHANTIER_SCAN_SCOPE_LEAK');
    if(snapshot.role==='chef_chantier'&&snapshot.online===true&&snapshot.counts.chantiers>0&&snapshot.counts.chefChantierStats===0)warnings.push('CHEF_CHANTIER_STATS_MISSING');
    if(snapshot.role!==null&&!['chef','admin'].includes(snapshot.role)&&count(s.prixCatalogue)>0)warnings.push('CATALOGUE_SCOPE_LEAK');
    if(snapshot.adminMode&&snapshot.role!=='admin')warnings.push('OWNER_ADMIN_MODE_ROLE_MISMATCH');
    if(snapshot.adminMode&&!snapshot.adminOwner)warnings.push('OWNER_ADMIN_MODE_WITHOUT_OWNER');
    if(snapshot.adminOwner&&snapshot.role==='admin'&&!snapshot.adminMode)warnings.push('OWNER_ADMIN_ROLE_OUTSIDE_MODE');
    if(snapshot.role===null&&snapshot.page!==null&&snapshot.page!=='login')warnings.push('SESSION_PAGE_WITHOUT_ROLE');
    if(snapshot.role===null&&Object.values(snapshot.counts).some(value=>value>0))warnings.push('SESSION_DATA_WITHOUT_ROLE');
    if(warnings.length)snapshot.warnings=warnings;
    return snapshot;
  }

  return {createDiagnosticsSnapshot};
});
