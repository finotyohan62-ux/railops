// Production refresh 2026-08-25: force Vercel/browser revalidation after Agent UPDATE hotfix.
const OFFLINE_KEY='ro_offline_queue';function assertSyncResult(a){if(a&&a.error)throw a.error;return a;}async function roPersistExistingMaterial(row){if(!row||!row.id)throw new Error('Materiel existant invalide');const {prix,autreChantier,...payload}=row;const result=await db.from('materiels').update(payload).eq('id',payload.id);if(result?.error)throw result.error;return result;}async function roPersistMaterial(row){if(String(S?.role||'').trim().toLowerCase()==='agent')return await roPersistExistingMaterial(row);if(!row||!row.id)throw new Error('Materiel invalide');const {prix,autreChantier,...payload}=row;const result=await db.from('materiels').upsert([payload],{onConflict:'id'});if(result?.error)throw result.error;return result;}function getOfflineQueue(){const as=a0b;try{return JSON[as(0x8b2)](localStorage[as(0x1f1)](OFFLINE_KEY)||'[]');}catch(a){return[];}}function saveOfflineQueue(a){const at=a0b;try{localStorage[at(0x887)](OFFLINE_KEY,JSON['stringify'](a));}catch(b){}}function addToOfflineQueue(a,b){const au=a0b,c=getOfflineQueue();c[au(0x1d9)]({'type':a,'data':b,'ts':Date[au(0x556)]()}),saveOfflineQueue(c),updateOfflineBadge();}function updateOfflineBadge(){const av=a0b,a=getOfflineQueue(),b=document[av(0x563)](av(0x782));if(!b)return;a[av(0x509)]>0x0?(b[av(0x7e5)][av(0x3f6)]='flex',b[av(0x4cd)]=a[av(0x509)]):b['style'][av(0x3f6)]=av(0x48b);}async function flushOfflineQueue(){const aw=a0b,a=getOfflineQueue();if(!a[aw(0x509)])return;if(!navigator[aw(0x5d0)])return;let b=0x0;const c=[];let d=[];try{const g=await db[aw(0x432)]('deleted_ids')['select']('*');d=g['data']||[];}catch(h){}const f=new Set((d||[])['map'](i=>i['id']||i['identifiant']));for(const i of a){try{if(i[aw(0x4b8)]===aw(0x65e)){if(f[aw(0x28d)](i['data'][aw(0x2d5)])){b++;continue;}const j=S['mat']['findIndex'](k=>k['id']===i['data']['materielId']);if(j===-0x1)throw new Error('Queued scan material missing');assertSyncResult(await db[aw(0x432)](aw(0x402))[aw(0x33d)]([i[aw(0x1f4)]],{'onConflict':'id'}));await roPersistMaterial(S[aw(0x684)][j]),b++;}else{if(i[aw(0x4b8)]===aw(0x388)){if(f[aw(0x28d)](i['data']['id'])){b++;continue;}await roPersistMaterial(i[aw(0x1f4)]),b++;}}}catch(k){c[aw(0x1d9)](i);}}saveOfflineQueue(c),updateOfflineBadge(),b>0x0&&(toast(b+aw(0x5f1),'ok'),setSyncStatus(aw(0x511)));}window['addEventListener'](a0ax(0x455),()=>{const ay=a0ax;setSyncStatus(ay(0x21d)),setTimeout(()=>{const az=ay;flushOfflineQueue(),setSyncStatus(az(0x511));},0x5dc);}),window[a0ax(0x273)]('offline',()=>{const aA=a0ax;setSyncStatus(aA(0x4a5)),toast(aA(0x498),aA(0x437));});

// v156 is registered from sync.js, which is loaded before the legacy inline import engines.
// Its capture listener therefore owns register-file selection and prevents older listeners
// from processing the same file a second time.
(function installUnifiedRegisterPickerGate(){
  if(typeof document==='undefined'||typeof document.addEventListener!=='function'||window.__ro156ImportCapture)return;
  window.__ro156ImportCapture=true;
  document.addEventListener('change',function(ev){
    const input=ev.target;
    if(typeof HTMLInputElement!=='undefined'&&!(input instanceof HTMLInputElement))return;
    if(!input||input.type!=='file')return;
    const file=input.files?.[0];
    if(!file||!/\.(?:xlsx|xls|xlsm|xlsb|ods|csv|txt)$/i.test(file.name||''))return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    let attempts=0;
    const dispatch=()=>{
      const handler=window.RailOpsRegisterImportV156?.handleInput;
      if(typeof handler==='function')return handler(input);
      if(attempts++<40)return setTimeout(dispatch,50);
      if(typeof window.importCSV==='function')return window.importCSV(input);
      if(typeof toast==='function')toast('Moteur d’import indisponible','danger');
    };
    dispatch();
  },true);
})();

(function loadRailOpsReportModules(){
  if(typeof document==='undefined'||typeof document.createElement!=='function')return;
  const modules=[
    {src:'./js/core/secure-register.js',ready:()=>!!window.RailOpsSecureRegistration},
    {src:'./js/core/register-import-v156.js',ready:()=>!!window.RailOpsRegisterImportV156},
    {src:'./js/reports/pdf-design-system.js',ready:()=>!!window.RailOpsPdfDesignSystem},
    {src:'./js/reports/inspection-report.js',ready:()=>!!window.RailOpsInspectionReport},
    {src:'./js/reports/inspection-report-ui.js',ready:()=>!!window.RailOpsInspectionReportUI},
    {src:'./js/reports/pdf-action-router.js',ready:()=>!!window.RailOpsPdfActionRouter},
    {src:'./js/reports/inspection-report-bootstrap.js',ready:()=>!!window.RailOpsInspectionReportBootstrap}
  ];
  let index=0;
  function next(){
    if(index>=modules.length)return;
    const item=modules[index++];
    if(item.ready()){next();return;}
    const script=document.createElement('script');
    script.src=item.src;
    script.async=false;
    script.onload=next;
    script.onerror=()=>console.warn('[RailOps] module indisponible:',item.src);
    (document.head||document.documentElement).appendChild(script);
  }
  next();
})();
