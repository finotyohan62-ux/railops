const fs=require('fs');
const assert=require('assert');

const visual=fs.readFileSync('js/core/visual-refresh.js','utf8');
const sync=fs.readFileSync('js/core/sync.js','utf8');

assert.ok(visual.includes('VISUAL_REFRESH_VERSION'),'visual refresh module version marker missing');
assert.ok(visual.includes('ro-visual-refresh-phase1'),'visual refresh style id missing');
assert.match(visual,/\.topbar\s*\{[^}]*min-height:\s*64px/s,'topbar must keep a stable premium mobile height');
assert.match(visual,/\.btn\s*\{[^}]*min-height:\s*48px/s,'primary buttons need a 48px touch target');
assert.match(visual,/\.ni\s*\{[^}]*min-height:\s*48px/s,'bottom navigation items need a 48px touch target');
assert.match(visual,/\.card\s*\{[^}]*box-shadow:/s,'cards must have the new visual depth');
assert.match(visual,/\.stat-card\s*\{[^}]*box-shadow:/s,'dashboard stat cards must use the new visual depth');
assert.match(visual,/\.cc\s*\{[^}]*box-shadow:/s,'chantier cards must use the new visual depth');
assert.ok(visual.includes('@media (prefers-reduced-motion: reduce)'),'reduced-motion accessibility fallback missing');
assert.ok(sync.includes("./js/core/visual-refresh.js"),'visual refresh module is not loaded by RailOps');

for(const forbidden of ['db.','supabase','rpc(','saveOfflineQueue','addToOfflineQueue','flushOfflineQueue']){
  assert.ok(!visual.includes(forbidden),`presentation-only module must not touch ${forbidden}`);
}

console.log('visual refresh phase 1 contract: ok');
