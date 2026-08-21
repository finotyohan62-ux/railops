(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{
    root.RailOpsChefChantierStats150B2B=api;
    api.installChefChantierStatsAdapter(root);
  }
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function num(value){
    const n=Number(value);
    return Number.isFinite(n)?n:0;
  }

  function aggregateChefChantierStats(rows,ids){
    const allowed=new Set((Array.isArray(ids)?ids:[]).map(id=>String(id)));
    return (Array.isArray(rows)?rows:[]).reduce((acc,row)=>{
      if(!row||!allowed.has(String(row.chantier_id)))return acc;
      acc.total+=num(row.total_materiels);
      acc.v1+=num(row.verif_1_ok);
      acc.v2+=num(row.verif_2_ok);
      return acc;
    },{total:0,v1:0,v2:0});
  }

  function installChefChantierStatsAdapter(target){
    if(!target||typeof target.statsFor!=='function')return false;
    if(target.__railopsChefChantierStats150B2BInstalled)return true;
    const baseStatsFor=target.statsFor;
    target.statsFor=function(c){
      let isChefChantier=false;
      let state=null;
      try{
        isChefChantier=typeof target.isCC==='function'&&target.isCC();
        state=typeof target.st==='function'?target.st():null;
      }catch(e){}
      if(!isChefChantier||!Array.isArray(state?.chefChantierStats)){
        return baseStatsFor.apply(this,arguments);
      }
      const ids=typeof target.descendants==='function'?target.descendants(c?.id):[c?.id];
      return aggregateChefChantierStats(state.chefChantierStats,ids);
    };
    target.__railopsChefChantierStats150B2BInstalled=true;
    return true;
  }

  return {aggregateChefChantierStats,installChefChantierStatsAdapter};
});
