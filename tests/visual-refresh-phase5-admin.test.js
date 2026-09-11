const fs=require('fs');
const assert=require('assert');

const visual=fs.readFileSync('js/core/visual-refresh.js','utf8');

assert.ok(visual.includes('1.4-visual-refresh-phase5-admin'),'phase 5 admin version marker missing');
assert.ok(visual.includes('VISUAL REFRESH PHASE 5 — admin, agents and forms'),'phase 5 admin CSS marker missing');
assert.match(visual,/\.msheet \.fi\s*\{[^}]*min-height:\s*48px[^}]*border-radius:\s*14px/s,'admin form fields must be comfortable and consistent');
assert.match(visual,/\.fl\s*\{[^}]*font-size:\s*11px[^}]*font-weight:\s*700/s,'form labels must have stronger hierarchy');
assert.match(visual,/select\.fi\s*\{[^}]*appearance:\s*none/s,'select fields must use the refreshed control surface');
assert.match(visual,/textarea\.fi\s*\{[^}]*min-height:\s*104px/s,'long-form admin fields must remain usable on mobile');
assert.match(visual,/\.tgl-row\s*\{[^}]*min-height:\s*52px[^}]*border:\s*1px solid var\(--border\)/s,'admin toggles must have a clear tap surface');
assert.match(visual,/\.msheet \.li \.avatar\s*\{[^}]*width:\s*42px[^}]*height:\s*42px/s,'agent rows must use a clearer identity surface');
assert.match(visual,/\.msheet \.btn\s*\{[^}]*min-height:\s*50px/s,'admin actions must remain thumb-friendly');

for(const forbidden of ['db.','supabase','rpc(','railops_upsert_scan','saveUser(','saveChantier(']){
  assert.ok(!visual.includes(forbidden),`admin visual phase must not touch ${forbidden}`);
}

console.log('visual refresh phase 5 admin contract: ok');
