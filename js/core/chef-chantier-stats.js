(function(root,factory){
'use strict';
const api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root){root.RailOpsChefChantierStats=api;api.install(root);}
})(typeof window!=='undefined'?window:null,function(){
'use strict';

const VERSION='1.1-chef-chantier-secure-stats';
const SYNTHETIC_PREFIX='__CHEF_STATS__';
let installed=false;

function num(v){
  const n=Number(v);
  return Number.isFinite(n)&&n>0?Math.floor(n):0;
}

function mondayKey(date){
  const d=date instanceof Date?new Date(date):new Date();
  d.setHours(12,0,0,0);
  const day=d.getDay()||7;
  d.setDate(d.getDate()-day+1);
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const dd=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

function buildSyntheticMaterials(rows,weekKey=mondayKey()){
  const out=[];
  const year=Number(String(weekKey).slice(0,4))||new Date().getFullYear();
  for(const raw of Array.isArray(rows)?rows:[]){
    const chantierId=String(raw?.chantier_id??raw?.chantierId??'').trim();
    if(!chantierId)continue;
    const total=num(raw?.total_materiels);
    const v1=Math.min(total,num(raw?.verif_1_ok??raw?.verif1_faite));
    const v2=Math.min(total,num(raw?.verif_2_ok??raw?.verif2_faite));
    const absents=Math.min(total,num(raw?.absents));
    const horsService=Math.min(total,num(raw?.hors_service));
    for(let i=0;i<total;i++){
      out.push({
        id:`${SYNTHETIC_PREFIX}${chantierId}__${i}`,
        chantierId,
        nom:'',cat:'',presence:i<absents?'absent':'present',
        etat:i<horsService?'hors-service':'bon',
        verifLundi:i<v1?{weekKey,year}:null,
        verifSemaine:i<v2?{weekKey,year}:null,
        __railopsSecureAggregate:true
      });
    }
  }
  return out;
}

function stateOf(root){
  if(root&&root.S)return root.S;
  try{if(typeof S!=='undefined')return S;}catch(e){}
  return null;
}

function isChefChantier(state){
  const role=String(state?.role||'').trim().toLowerCase().replace(/[\s-]+/g,'_');
  return role==='chef_chantier'||role==='chef_de_chantier';
}

function wrap(root){
  if(installed||!root||typeof root.render!=='function')return false;
  const base=root.render;
  function secureChefRender(){
    const state=stateOf(root);
    if(!isChefChantier(state)||!Array.isArray(state?.chefChantierStats))return base.apply(this,arguments);
    const original=state.mat;
    state.mat=buildSyntheticMaterials(state.chefChantierStats,mondayKey());
    try{return base.apply(this,arguments);}
    finally{state.mat=original;}
  }
  secureChefRender.__railopsChefStatsWrapped=true;
  secureChefRender.__railopsBaseRender=base;
  root.render=secureChefRender;
  installed=true;
  return true;
}

function install(root,options={}){
  if(!root)return false;
  if(options.defer===false)return wrap(root);
  const attempt=()=>{
    if(wrap(root)){
      const state=stateOf(root);
      if(isChefChantier(state)){try{root.render();}catch(e){}}
      return;
    }
    if(!installed)setTimeout(attempt,50);
  };
  if(root.document?.readyState==='loading')root.document.addEventListener('DOMContentLoaded',attempt,{once:true});
  else setTimeout(attempt,0);
  return true;
}

return {VERSION,SYNTHETIC_PREFIX,mondayKey,buildSyntheticMaterials,isChefChantier,install};
});
