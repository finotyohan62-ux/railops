const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (!index.includes('async function roPersistExistingMaterial(')) {
  fail('agent-safe existing-material persistence helper is missing');
}
if (!index.includes("db.from('materiels').update(payload).eq('id',payload.id)")) {
  fail('existing material persistence must use UPDATE by id');
}
if (!index.includes('async function roPersistMaterial(') || !index.includes('return await roPersistExistingMaterial(row)')) {
  fail('agent role is not routed to update-only material persistence');
}
if (!index.includes('await roPersistMaterial(b)')) {
  fail('live material save path is not wired to role-aware persistence');
}
if (!index.includes('await roPersistMaterial(S[aw(0x684)][j])')) {
  fail('offline scan material synchronization is not wired to role-aware persistence');
}
if (!index.includes("await roPersistMaterial(i[aw(0x1f4)])")) {
  fail('offline queued material persistence is not wired to role-aware persistence');
}

console.log('PASS: agent inventory material persistence is update-only for existing rows');
