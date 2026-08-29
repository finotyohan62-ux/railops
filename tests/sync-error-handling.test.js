const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const syncSource = fs.readFileSync(path.join(__dirname, '..', 'js/core/sync.js'), 'utf8');

const decoder = new Map([
  [0x8b2, 'parse'], [0x1f1, 'getItem'], [0x887, 'setItem'],
  [0x1d9, 'push'], [0x556, 'now'], [0x563, 'getElementById'],
  [0x782, 'offline-badge'], [0x509, 'length'], [0x5d0, 'onLine'],
  [0x432, 'from'], [0x4b8, 'type'], [0x65e, 'scan'], [0x28d, 'has'],
  [0x2d5, 'materielId'], [0x402, 'scans'], [0x33d, 'upsert'],
  [0x1f4, 'data'], [0x338, 'materiels'], [0x684, 'mat'],
  [0x388, 'materiel'], [0x5f1, ' synchronized'], [0x511, 'synced']
]);
const eventDecoder = new Map([[0x455, 'online'], [0x273, 'addEventListener']]);

function createHarness({
  queue,
  online = true,
  scanResults = [{ data: null, error: null }],
  materielResults = [{ data: null, error: null }]
}) {
  const storage = new Map([['ro_offline_queue', JSON.stringify(queue)]]);
  const calls = [];
  let scanIndex = 0;
  let materielIndex = 0;
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, value); }
  };
  const next = (results, index) => results[Math.min(index, results.length - 1)];
  const db = {
    from(table) {
      if (table === 'deleted_ids') return { select: async () => ({ data: [], error: null }) };
      return {
        upsert: async (...args) => {
          calls.push({ table, args });
          if (table === 'scans') return next(scanResults, scanIndex++);
          if (table === 'materiels') return next(materielResults, materielIndex++);
          throw new Error(`unexpected table ${table}`);
        }
      };
    }
  };
  const context = {
    JSON, Date, Set,
    a0b: code => decoder.get(code) ?? `unknown_${code}`,
    a0ax: code => eventDecoder.get(code) ?? `event_${code}`,
    localStorage,
    navigator: { onLine: online },
    document: { getElementById: () => null },
    window: { addEventListener: () => {} },
    db,
    S: { mat: [{ id: 'mat-1' }] },
    toast: () => {},
    setSyncStatus: () => {},
    setTimeout: () => {},
    console
  };
  vm.createContext(context);
  vm.runInContext(syncSource, context, { filename: 'sync.js' });
  return {
    context,
    calls,
    setOnline(value) { context.navigator.onLine = value; },
    getQueue: () => JSON.parse(storage.get('ro_offline_queue') || '[]')
  };
}

async function testScanSupabaseErrorStaysQueued() {
  const item = { type: 'scan', data: { id: 'scan-1', materielId: 'mat-1' }, ts: 1 };
  const harness = createHarness({
    queue: [item],
    scanResults: [{ data: null, error: new Error('Supabase rejected scan') }]
  });
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'scan must stay queued on Supabase error');
}

async function testRelatedMaterielErrorKeepsScanQueuedForRetry() {
  const item = { type: 'scan', data: { id: 'scan-2', materielId: 'mat-1' }, ts: 2 };
  const harness = createHarness({
    queue: [item],
    scanResults: [{ data: null, error: null }],
    materielResults: [{ data: null, error: new Error('Supabase rejected materiel update') }]
  });
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'scan must stay queued if its related material update fails');
}

async function testMissingRelatedMaterielNeverUploadsScan() {
  const item = { type: 'scan', data: { id: 'scan-ghost', materielId: 'missing-mat' }, ts: 3 };
  const harness = createHarness({ queue: [item] });
  harness.context.S.mat = [];
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'scan must stay queued while its related material is missing');
  assert.strictEqual(harness.calls.filter(call => call.table === 'scans').length, 0, 'orphan scan must not be uploaded');
  assert.strictEqual(harness.calls.filter(call => call.table === 'materiels').length, 0, 'missing material must not trigger a material write');
}

async function testMaterielSupabaseErrorStaysQueued() {
  const item = { type: 'materiel', data: { id: 'mat-2' }, ts: 4 };
  const harness = createHarness({
    queue: [item],
    materielResults: [{ data: null, error: new Error('Supabase rejected materiel') }]
  });
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'material must stay queued on Supabase error');
}

async function testSuccessfulSyncDrainsQueue() {
  const item = { type: 'scan', data: { id: 'scan-3', materielId: 'mat-1' }, ts: 5 };
  const harness = createHarness({ queue: [item] });
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [], 'successful scan sync must drain queue');
  const scanCall = harness.calls.find(call => call.table === 'scans');
  assert.ok(scanCall, 'scan upsert must be called');
  assert.strictEqual(scanCall.args[1].onConflict, 'id', 'scan retry must remain idempotent by id');
}

async function testOfflineDoesNotAttemptSync() {
  const item = { type: 'scan', data: { id: 'scan-4', materielId: 'mat-1' }, ts: 6 };
  const harness = createHarness({ queue: [item], online: false });
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'offline queue must remain untouched while offline');
  assert.strictEqual(harness.calls.length, 0, 'no database write may be attempted while offline');
}

async function testOfflineReconnectFlushesSameScan() {
  const item = { type: 'scan', data: { id: 'scan-reconnect', materielId: 'mat-1' }, ts: 7 };
  const harness = createHarness({ queue: [item], online: false });

  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'scan must remain queued before connectivity returns');
  assert.strictEqual(harness.calls.length, 0, 'offline phase must not attempt a database write');

  harness.setOnline(true);
  await harness.context.flushOfflineQueue();

  assert.deepStrictEqual(harness.getQueue(), [], 'reconnect must drain the queued scan after confirmed writes');
  const scanCalls = harness.calls.filter(call => call.table === 'scans');
  assert.strictEqual(scanCalls.length, 1, 'reconnect must upload the queued scan once in this scenario');
  assert.strictEqual(scanCalls[0].args[0][0].id, 'scan-reconnect', 'reconnect must preserve the original stable scan id');
  assert.strictEqual(scanCalls[0].args[1].onConflict, 'id', 'reconnect upload must stay idempotent by scan id');
}

async function testRetryUsesSameStableScanId() {
  const item = { type: 'scan', data: { id: 'scan-stable', materielId: 'mat-1' }, ts: 8 };
  const harness = createHarness({
    queue: [item],
    scanResults: [
      { data: null, error: new Error('temporary rejection') },
      { data: null, error: null }
    ]
  });
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'failed first attempt must remain queued');
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [], 'successful retry must drain queue');
  const scanCalls = harness.calls.filter(call => call.table === 'scans');
  assert.strictEqual(scanCalls.length, 2, 'scan must be retried exactly once in this scenario');
  assert.strictEqual(scanCalls[0].args[0][0].id, 'scan-stable');
  assert.strictEqual(scanCalls[1].args[0][0].id, 'scan-stable');
  assert.strictEqual(scanCalls[1].args[1].onConflict, 'id');
}

(async () => {
  await testScanSupabaseErrorStaysQueued();
  await testRelatedMaterielErrorKeepsScanQueuedForRetry();
  await testMissingRelatedMaterielNeverUploadsScan();
  await testMaterielSupabaseErrorStaysQueued();
  await testSuccessfulSyncDrainsQueue();
  await testOfflineDoesNotAttemptSync();
  await testOfflineReconnectFlushesSameScan();
  await testRetryUsesSameStableScanId();
  console.log('sync error handling checks passed (8 cases)');
})().catch(err => {
  console.error(err.stack || err);
  process.exit(1);
});