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

if (!index.includes('await roPersistExistingMaterial(S[')) {
  fail('material save path is not wired to the UPDATE helper');
}

if (!index.includes('await roPersistExistingMaterial(S[') || !index.includes("i['data']['materielId']")) {
  fail('offline scan material synchronization is not guarded by existing-material UPDATE persistence');
}

console.log('PASS: agent inventory material persistence is update-only for existing rows');
