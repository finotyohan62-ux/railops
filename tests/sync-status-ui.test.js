const assert=require('assert');
const fs=require('fs');
const path=require('path');

const modulePath=path.join(__dirname,'../js/core/sync-status.js');
const syncPath=path.join(__dirname,'../js/core/sync.js');
const ui=require(modulePath);

assert.strictEqual(typeof ui.safeQueue,'function','sync status module must expose safeQueue');
assert.strictEqual(typeof ui.pendingMaterialIds,'function','sync status module must expose pendingMaterialIds');
assert.strictEqual(typeof ui.deriveStatus,'function','sync status module must expose deriveStatus');
assert.strictEqual(typeof ui.createBrowserApi,'function','sync status module must expose createBrowserApi');

(function safeQueueNeverThrows(){
  assert.deepStrictEqual(ui.safeQueue(''),[]);
  assert.deepStrictEqual(ui.safeQueue('{broken json'),[]);
  assert.deepStrictEqual(ui.safeQueue({not:'an array'}),[]);
  assert.deepStrictEqual(ui.safeQueue('[{"type":"scan","data":{"materielId":"MAT-1"}}]'),[
    {type:'scan',data:{materielId:'MAT-1'}}
  ]);
})();

(function derivePresentationState(){
  const synced=ui.deriveStatus({online:true,queue:[]});
  assert.strictEqual(synced.state,'synced');
  assert.strictEqual(synced.pending,0);
  assert.strictEqual(synced.label,'Synchronisé');

  const pending=ui.deriveStatus({online:true,queue:[{type:'scan',data:{materielId:'A'}},{type:'material',data:{id:'B'}}]});
  assert.strictEqual(pending.state,'pending');
  assert.strictEqual(pending.pending,2);
  assert.strictEqual(pending.label,'2 en attente');

  const offline=ui.deriveStatus({online:false,queue:[{type:'scan',data:{materielId:'A'}}],error:'server error'});
  assert.strictEqual(offline.state,'offline','offline must win over a stale explicit error');
  assert.strictEqual(offline.pending,1);
  assert.strictEqual(offline.label,'Hors ligne · 1 en attente');

  const error=ui.deriveStatus({online:true,queue:[],error:'server error'});
  assert.strictEqual(error.state,'error');
  assert.strictEqual(error.label,'Erreur de synchronisation');
})();

(function pendingMaterialIdentityIsDerivedWithoutMutation(){
  const queue=[
    {type:'scan',data:{materielId:'MAT-1'}},
    {type:'material',data:{id:'MAT-2'}},
    {type:'scan',data:{materielId:'MAT-1'}},
    {type:'other',data:{}}
  ];
  const snapshot=JSON.stringify(queue);
  assert.deepStrictEqual(ui.pendingMaterialIds(queue),['MAT-1','MAT-2']);
  assert.strictEqual(JSON.stringify(queue),snapshot,'diagnostics must never mutate the offline queue');
})();

(function browserIntegrationIsPassiveAndIdempotentByContract(){
  const source=fs.readFileSync(modulePath,'utf8');
  assert(source.includes("ro_offline_queue"),'browser diagnostics must read the existing queue key');
  assert(source.includes("ro-sync-status"),'status chip must use its own stable DOM id');
  assert(source.includes("ro-sync-attention"),'attention banner must use its own stable DOM id');
  assert(source.includes("addEventListener('online'"),'must refresh when connection returns');
  assert(source.includes("addEventListener('offline'"),'must refresh when connection drops');
  assert(source.includes("addEventListener('storage'"),'must refresh when queue storage changes');
  assert(source.includes('MutationObserver'),'must survive RailOps page re-renders without modifying render()');
  assert(!source.includes('db.'),'presentation module must not write to Supabase');
  assert(!source.includes('.rpc('),'presentation module must not call RPCs');
  assert(!source.includes('saveOfflineQueue'),'presentation module must not own queue persistence');
  assert(!source.includes('addToOfflineQueue'),'presentation module must not own queue writes');
  assert(!source.includes('flushOfflineQueue'),'presentation module must not own queue flushing');
})();

(function syncEngineOnlyLoadsDiagnosticsAndKeepsAtomicPath(){
  const syncSource=fs.readFileSync(syncPath,'utf8');
  assert(syncSource.includes("./js/core/sync-status.js"),'sync module loader must load sync-status diagnostics');
  assert(syncSource.includes("const OFFLINE_KEY='ro_offline_queue'"),'existing offline queue key must remain unchanged');
  assert(syncSource.includes("db.rpc('railops_upsert_scan'"),'atomic offline scan RPC path must remain present');
})();

console.log('PASS: sync status UI is passive, queue-safe and presentation-only');
