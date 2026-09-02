(function(){
'use strict';
const VERSION='150B2B-maintenance-1';
let maintenanceTimer=null;
function warn(...a){try{console.warn('[RailOps v150B-2B maintenance]',...a);}catch(e){}}
async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data;}
function storeMats(){try{localStorage.setItem('ro3_m',JSON.stringify(S.mat||[]));}catch(e){}}
function currentWeekKeyFor(m){try{const jr=getJR(m.chantierId);return {jr,week:getWeekKey(jr)};}catch(e){return null;}}

cleanStaleVerifs=async function(){
  if(!S?.agent)return;
  let changed=false;
  const updates=new Set();
  const mats=S.mat||[];
  const scans=S.scans||[];

  for(const m of mats){
    const wk=currentWeekKeyFor(m);if(!wk)continue;
    let rowChanged=false;
    if(m.verifLundi?.weekKey&&m.verifLundi.weekKey!==wk.week){m.verifLundi=null;rowChanged=true;changed=true;}
    if(m.verifSemaine?.weekKey&&m.verifSemaine.weekKey!==wk.week){m.verifSemaine=null;rowChanged=true;changed=true;}
    if(rowChanged)updates.add(String(m.id));
  }

  const scannedByChantier={};
  for(const sc of scans){
    const m=mats.find(x=>String(x.id)===String(sc.materielId));if(!m||!sc.date)continue;
    const wk=currentWeekKeyFor(m);if(!wk)continue;
    try{
      const shifted=new Date(new Date(sc.date).getTime()-14*24*60*60*1000);
      const d=new Date(Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate()));
      const delta=(d.getUTCDay()-wk.jr+7)%7;
      d.setUTCDate(d.getUTCDate()-delta);
      const key=d.toISOString().split('T')[0];
      if(key===wk.week){
        if(!scannedByChantier[m.chantierId])scannedByChantier[m.chantierId]=new Set();
        scannedByChantier[m.chantierId].add(String(sc.materielId));
      }
    }catch(e){}
  }

  for(const m of mats){
    const wk=currentWeekKeyFor(m);if(!wk)continue;
    const verifiedNow=(m.verifLundi?.weekKey===wk.week)||(m.verifSemaine?.weekKey===wk.week);
    const scanned=scannedByChantier[m.chantierId]||new Set();
    if(verifiedNow&&!scanned.has(String(m.id))){
      m.verifLundi=null;m.verifSemaine=null;updates.add(String(m.id));changed=true;
    }
  }

  for(const id of updates){
    try{await rpc('railops_save_material_state',{p_id:id,p_patch:{verifLundi:null,verifSemaine:null}});}catch(e){warn('reset verification refused',id,e?.message||e);}
  }

  if(changed){storeMats();try{restoreMultiChantier?.();}catch(e){}try{renderTab?.();}catch(e){}}

  try{await rpc('railops_purge_old_deleted_ids',{p_before:new Date(Date.now()-30*24*60*60*1000).toISOString()});}catch(e){warn('tombstone cleanup',e?.message||e);}
};
window.cleanStaleVerifs=cleanStaleVerifs;

function scheduleMaintenance(delay=3000){
  if(maintenanceTimer)clearTimeout(maintenanceTimer);
  maintenanceTimer=setTimeout(async()=>{
    try{
      const ses=(await db.auth.getSession())?.data?.session;if(!ses||!S?.agent)return;
      await cleanStaleVerifs();
      try{await checkWeeklyArchive?.();}catch(e){warn('weekly archive',e?.message||e);}
    }catch(e){warn('maintenance',e?.message||e);}
  },delay);
}

try{db.auth.onAuthStateChange((event,session)=>{if(session&&['SIGNED_IN','INITIAL_SESSION','TOKEN_REFRESHED'].includes(event))scheduleMaintenance(3200);});}catch(e){}
setTimeout(()=>scheduleMaintenance(500),1200);
window.RailOpsMaintenance150B2B={version:VERSION,run:()=>scheduleMaintenance(0)};
console.info('[RailOps] maintenance hebdomadaire sécurisée —',VERSION);
})();
