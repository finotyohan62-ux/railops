const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(process.argv[2] || 'js/core/lifecycle.js', 'utf8');

function makeContext(options = {}) {
  const calls = [];
  const storage = new Map(Object.entries(options.storage || {}));
  const inspection = {
    id: 'inspection-1',
    materielId: 'mat-1',
    chantierId: 'chantier-1',
    agentNom: 'Agent Test',
    date: '2026-08-29T06:00:00.000Z',
    etatGeneral: 'acceptable',
    proprete: 'bon',
    fonctionnement: true,
    dommages: true,
    dommagesDesc: 'Rayure capot',
    observations: 'Contrôle complet',
    actions: 'Surveillance',
    photo: 'photo-ref',
    lat: 50.95,
    lng: 1.85,
  };
  const inspectionEdge = {
    id: 'inspection-2',
    materielId: 'mat-2',
    chantierId: 'chantier-1',
    agentNom: 'Agent Test',
    date: '2026-08-29T06:05:00.000Z',
    etatGeneral: 'bon',
    proprete: 'acceptable',
    fonctionnement: false,
    dommages: false,
    dommagesDesc: null,
    observations: '',
    actions: null,
    photo: null,
    lat: 0,
    lng: 0,
  };

  const inspections = options.inspections === undefined ? [inspection, inspectionEdge] : options.inspections;
  const rpcData = {
    railops_session_context: { ok: true, nom: 'Chef Test', role: 'chef', is_admin_owner: false },
    railops_chantiers_scope: [{ id: 'chantier-1', nom: 'Chantier Test' }],
    railops_materials_scope: [{ id: 'mat-1', chantierId: 'chantier-1' }],
    railops_scans_scope: inspections,
    railops_user_directory: [{ id: 'user-1', nom: 'Chef Test', badge: 'C1', role: 'chef', is_admin: false }],
    railops_catalogue_scope: [],
  };

  const ctx = {
    console: { info() {}, warn() {}, error() {} },
    Map, Promise, Array, Object, String, TypeError, JSON,
    setTimeout() { return 1; },
    clearTimeout() {},
    MutationObserver: class { observe() {} },
    document: { getElementById() { return {}; }, body: {} },
    localStorage: {
      setItem(key, value) { storage.set(key, String(value)); },
      getItem(key) { return storage.get(key) || null; },
      removeItem(key) { storage.delete(key); },
    },
    S: { agent: null, role: null, page: 'login', users: [], mat: [], scans: [], chantiers: [] },
    normMats(items) { return items; },
    setupRealtime() {},
  };

  ctx.db = {
    auth: {
      async getSession() {
        calls.push(['getSession']);
        return { data: { session: { access_token: 'test-token' } } };
      },
    },
    async rpc(name) {
      calls.push(['rpc', name]);
      return { data: rpcData[name], error: null };
    },
    from() {
      throw new Error('inspection secure read must not use direct table access');
    },
  };

  ctx.window = ctx;
  ctx.load = async () => {};
  ctx.window.load = ctx.load;
  ctx.render = () => {};
  ctx.window.render = ctx.render;

  vm.createContext(ctx);
  vm.runInContext(source, ctx, { filename: 'lifecycle.js' });
  return { ctx, calls, storage, inspection, inspectionEdge, inspections };
}

(async () => {
  const h = makeContext();
  await h.ctx.window.load();

  const rpcNames = h.calls.filter(call => call[0] === 'rpc').map(call => call[1]);
  assert.ok(rpcNames.includes('railops_scans_scope'), 'Chef secure load must read inspections through railops_scans_scope');
  assert.equal(rpcNames.includes('railops_admin_scans_scope'), false, 'Chef secure load must not use the admin scan scope');

  assert.equal(
    JSON.stringify(h.ctx.S.scans),
    JSON.stringify(h.inspections),
    'secure load must preserve every inspection field needed by the Chef view'
  );
  assert.equal(typeof h.ctx.S.scans[0].fonctionnement, 'boolean', 'fonctionnement must stay boolean from the scoped RPC');
  assert.equal(typeof h.ctx.S.scans[0].dommages, 'boolean', 'dommages must stay boolean from the scoped RPC');
  assert.equal(typeof h.ctx.S.scans[0].lat, 'number', 'inspection latitude must stay numeric');
  assert.equal(typeof h.ctx.S.scans[0].lng, 'number', 'inspection longitude must stay numeric');
  assert.equal(h.ctx.S.scans[1].fonctionnement, false, 'false fonctionnement must not be dropped or coerced');
  assert.equal(h.ctx.S.scans[1].dommages, false, 'false dommages must not be dropped or coerced');
  assert.equal(h.ctx.S.scans[1].lat, 0, 'zero latitude must be preserved');
  assert.equal(h.ctx.S.scans[1].lng, 0, 'zero longitude must be preserved');
  assert.equal(h.ctx.S.scans[1].dommagesDesc, null, 'nullable damage description must stay null');
  assert.equal(h.ctx.S.scans[1].actions, null, 'nullable actions must stay null');
  assert.equal(h.ctx.S.scans[1].photo, null, 'nullable photo must stay null');
  assert.equal(
    h.storage.get('ro3_s'),
    JSON.stringify(h.inspections),
    'secure cache must mirror the complete scoped inspection payload including false, zero and null values'
  );

  const empty = makeContext({
    inspections: [],
    storage: { ro3_s: JSON.stringify([{ id: 'stale-inspection' }]) },
  });
  await empty.ctx.window.load();
  assert.deepEqual(Array.from(empty.ctx.S.scans), [], 'an empty scoped inspection response must clear in-memory stale inspections');
  assert.equal(empty.storage.get('ro3_s'), '[]', 'an empty scoped inspection response must replace stale cached inspections');

  console.log('PASS: Chef inspection secure-read contract preserves scoped records, backend values and authoritative empty responses');
})().catch(error => {
  console.error(error);
  process.exit(1);
});