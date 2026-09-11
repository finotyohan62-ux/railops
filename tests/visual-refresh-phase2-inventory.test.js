const fs=require('fs');
const assert=require('assert');

const visual=fs.readFileSync('js/core/visual-refresh.js','utf8');

assert.ok(visual.includes('VISUAL REFRESH PHASE 2 — inventory and material cards'),'phase 2 inventory marker missing');
assert.match(visual,/\.reg-item\s*\{[^}]*border-radius:\s*18px[^}]*position:\s*relative[^}]*overflow:\s*hidden/s,'material cards need the phase 2 shell');
assert.match(visual,/\.reg-item\.present::before\s*\{[^}]*background:\s*var\(--success\)/s,'present material needs a green status rail');
assert.match(visual,/\.reg-item\.non-confirme::before\s*\{[^}]*background:\s*var\(--accent\)/s,'unconfirmed material needs an orange status rail');
assert.match(visual,/\.reg-item\.absent::before\s*\{[^}]*background:\s*var\(--danger\)/s,'absent material needs a red status rail');
assert.match(visual,/\.reg-top\s*\{[^}]*min-height:\s*44px/s,'material summary row needs a reliable touch/read height');
assert.match(visual,/\.reg-body\s*\{[^}]*border-radius:\s*12px[^}]*padding:\s*10px/s,'material detail area must read as a nested information surface');
assert.match(visual,/\.ps-ok\s*,\s*\.ps-warn\s*,\s*\.ps-absent\s*\{[^}]*width:\s*34px[^}]*height:\s*34px/s,'presence icons need consistent 34px sizing');
assert.match(visual,/\.reg-item\s+\.it\s*\{[^}]*font-size:\s*15px/s,'material reference/name must be visually prominent');
assert.ok(visual.includes('@media (max-width:380px)'),'small phone fallback must remain present');

for(const forbidden of ['db.','supabase','rpc(','saveOfflineQueue','addToOfflineQueue','flushOfflineQueue']){
  assert.ok(!visual.includes(forbidden),`visual refresh must stay presentation-only and not touch ${forbidden}`);
}

console.log('visual refresh phase 2 inventory contract: ok');
