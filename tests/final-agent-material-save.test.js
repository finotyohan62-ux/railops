const fs=require('node:fs');
const path=require('node:path');
function fail(m){console.error('FAIL:',m);process.exit(1)}
const root=path.resolve(__dirname,'..');
const sync=fs.readFileSync(path.join(root,'js/core/sync.js'),'utf8');
const legacy=fs.readFileSync(path.join(root,'js/legacy-core.js'),'utf8');
if(!sync.includes('async function roPersistExistingMaterial('))fail('missing update-only existing material helper');
if(!sync.includes("db.from('materiels').update(payload).eq('id',payload.id)"))fail('agent existing material path is not UPDATE by id');
if(!sync.includes("String(S?.role||'').trim().toLowerCase()==='agent'"))fail('missing agent role gate');
if(!sync.includes('return await roPersistExistingMaterial(row)'))fail('agent gate does not use update-only helper');
if(!sync.includes('await roPersistMaterial(S[aw(0x684)][j])'))fail('offline scan material save still bypasses role-aware persistence');
if(!sync.includes("await roPersistMaterial(i[aw(0x1f4)])"))fail('offline material queue still bypasses role-aware persistence');
if(!legacy.includes('await roPersistMaterial(b)'))fail('live saveMat still bypasses role-aware persistence');
if(!legacy.includes("if(i!==-0x1)saveMat(S['curM'])"))fail('live scan no longer routes material state through saveMat');
console.log('PASS: agent material persistence uses UPDATE for existing rows on live/offline paths');
