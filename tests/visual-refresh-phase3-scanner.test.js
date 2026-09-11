const fs=require('fs');
const assert=require('assert');

const visual=fs.readFileSync('js/core/visual-refresh.js','utf8');

assert.ok(visual.includes('1.2-visual-refresh-phase3-scanner'),'phase 3 scanner version marker missing');
assert.ok(visual.includes('VISUAL REFRESH PHASE 3 — scanner'),'phase 3 scanner CSS marker missing');
assert.match(visual,/\.cam-wrap\s*\{[^}]*border-radius:\s*18px[^}]*overflow:\s*hidden[^}]*box-shadow:/s,'camera surface must be clipped and visually elevated');
assert.match(visual,/#cam-video\s*\{[^}]*min-height:\s*280px[^}]*object-fit:\s*cover/s,'camera video must keep a stable mobile scanning area');
assert.match(visual,/\.scan-frame\s*\{[^}]*width:\s*210px[^}]*height:\s*210px/s,'scan target must be large and easy to aim');
assert.match(visual,/\.scan-beam\s*\{[^}]*height:\s*3px[^}]*box-shadow:/s,'scan beam must be visually stronger without changing scan logic');
assert.match(visual,/\.scan-hint\s*\{[^}]*min-height:\s*36px[^}]*backdrop-filter:/s,'scan hint must remain legible over live camera');
assert.match(visual,/@media \(max-width:380px\)[\s\S]*\.scan-frame\s*\{[^}]*width:\s*180px[^}]*height:\s*180px/s,'scanner must adapt on compact phones');

for(const forbidden of ['db.','supabase','rpc(','railops_upsert_scan']){
  assert.ok(!visual.includes(forbidden),`scanner visual phase must not touch ${forbidden}`);
}

console.log('visual refresh phase 3 scanner contract: ok');
