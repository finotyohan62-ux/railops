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
  scanResults = [{ data: { id: 'scan-ok' }, error: null }],
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
    async rpc(name, args) {
      calls.push({ kind: 'rpc', name, args });
      if (name === 'railops_upsert_scan') return next(scanResults, scanIndex++);
      if (name === 'railops_upsert_material_admin') return next(materielResults, materielIndex++);
      throw new Error(`unexpected rpc ${name}`);
    },
    from(table) {
      if (table === 'deleted_ids') return { select: async () => ({ data: [], error: null }) };
      return {
        upsert: async (...args) => {
          calls.push({ kind: 'upsert', table, args });
          if (table === 'scans') return next(scanResults, scanIndex++);
          throw new Error(`unexpected upsert table ${table}`);
        },
        update: (...args) => ({
          eq: async (...eqArgs) => {
            calls.push({ kind: 'update', table, args, eqArgs });
            if (table === 'materiels') return next(materielResults, materielIndex++);
            throw new Error(`unexpected update table ${table}`);
          }
        })
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
    S: { role: 'agent', mat: [{ id: 'mat-1' }] },
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

async function testScanRpcErrorStaysQueued() {
  const item = { type: 'scan', data: { id: 'scan-1', materielId: 'mat-1', chantierId: 'ch-1' }, ts: 1 };
  const harness = createHarness({
    queue: [item],
    scanResults: [{ data: null, error: new Error('Supabase rejected atomic scan') }]
  });
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'scan must stay queued on atomic RPC error');
}

async function testMissingRelatedMaterielNeverUploadsScan() {
  const item = { type: 'scan', data: { id: 'scan-ghost', materielId: 'missing-mat', chantierId: 'ch-1' }, ts: 3 };
  const harness = createHarness({ queue: [item] });
  harness.context.S.mat = [];
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'scan must stay queued while its related material is missing');
  assert.strictEqual(harness.calls.filter(call => call.name === 'railops_upsert_scan').length, 0, 'orphan scan must not call the atomic RPC');
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

async function testSuccessfulScanSyncUsesAtomicRpcAndDrainsQueue() {
  const scan = { id: 'scan-3', materielId: 'mat-1', chantierId: 'ch-1', date: '2026-09-11T00:00:00.000Z' };
  const item = { type: 'scan', data: scan, ts: 5 };
  const harness = createHarness({ queue: [item] });
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [], 'successful atomic scan sync must drain queue');
  const rpcCall = harness.calls.find(call => call.kind === 'rpc' && call.name === 'railops_upsert_scan');
  assert.ok(rpcCall, 'offline scan must use railops_upsert_scan');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(rpcCall.args)), { p_scan: scan }, 'atomic RPC must receive the queued scan unchanged');
  assert.strictEqual(harness.calls.filter(call => call.kind === 'upsert' && call.table === 'scans').length, 0, 'offline scan must not bypass the RPC with a direct scans upsert');
  assert.strictEqual(harness.calls.filter(call => call.kind === 'update' && call.table === 'materiels').length, 0, 'atomic scan RPC must not be followed by a separate material update');
}

async function testOfflineDoesNotAttemptSync() {
  const item = { type: 'scan', data: { id: 'scan-4', materielId: 'mat-1', chantierId: 'ch-1' }, ts: 6 };
  const harness = createHarness({ queue: [item], online: false });
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'offline queue must remain untouched while offline');
  assert.strictEqual(harness.calls.length, 0, 'no database write may be attempted while offline');
}

async function testRetryUsesSameStableScanIdThroughRpc() {
  const scan = { id: 'scan-stable', materielId: 'mat-1', chantierId: 'ch-1' };
  const item = { type: 'scan', data: scan, ts: 7 };
  const harness = createHarness({
    queue: [item],
    scanResults: [
      { data: null, error: new Error('temporary rejection') },
      { data: { id: 'scan-stable' }, error: null }
    ]
  });
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [item], 'failed first attempt must remain queued');
  await harness.context.flushOfflineQueue();
  assert.deepStrictEqual(harness.getQueue(), [], 'successful retry must drain queue');
  const scanCalls = harness.calls.filter(call => call.kind === 'rpc' && call.name === 'railops_upsert_scan');
  assert.strictEqual(scanCalls.length, 2, 'atomic scan RPC must be retried exactly once in this scenario');
  assert.strictEqual(scanCalls[0].args.p_scan.id, 'scan-stable');
  assert.strictEqual(scanCalls[1].args.p_scan.id, 'scan-stable');
}

(async () => {
  await testScanRpcErrorStaysQueued();
  await testMissingRelatedMaterielNeverUploadsScan();
  await testMaterielSupabaseErrorStaysQueued();
  await testSuccessfulScanSyncUsesAtomicRpcAndDrainsQueue();
  await testOfflineDoesNotAttemptSync();
  await testRetryUsesSameStableScanIdThroughRpc();
  console.log('sync error handling checks passed (6 cases)');
})().catch(err => {
  console.error(err.stack || err);
  process.exit(1);
});
