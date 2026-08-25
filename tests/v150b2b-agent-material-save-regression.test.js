const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sync = fs.readFileSync(path.join(root, 'js/core/sync.js'), 'utf8');
const legacy = fs.readFileSync(path.join(root, 'js/legacy-core.js'), 'utf8');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (!sync.includes('async function roPersistExistingMaterial(')) {
  fail('agent-safe existing-material persistence helper is missing');
}
if (!sync.includes("db.from('materiels').update(payload).eq('id',payload.id)")) {
  fail('existing material persistence must use UPDATE by id');
}
if (!sync.includes('async function roPersistMaterial(') || !sync.includes('return await roPersistExistingMaterial(row)')) {
  fail('agent role is not routed to update-only material persistence');
}
if (!legacy.includes('await roPersistMaterial(b)')) {
  fail('live material save path is not wired to role-aware persistence');
}
if (!sync.includes('await roPersistMaterial(S[aw(0x684)][j])')) {
  fail('offline scan material synchronization is not wired to role-aware persistence');
}
if (!sync.includes("await roPersistMaterial(i[aw(0x1f4)])")) {
  fail('offline queued material persistence is not wired to role-aware persistence');
}

console.log('PASS: agent inventory material persistence is update-only for existing rows');
