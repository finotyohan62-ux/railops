const fs=require('fs');
const assert=require('assert');

assert.ok(fs.existsSync('js/core/visual-finishing.js'),'phase 6 finishing module missing');
const visual=fs.readFileSync('js/core/visual-finishing.js','utf8');
const sync=fs.readFileSync('js/core/sync.js','utf8');

assert.ok(visual.includes('1.5-visual-refresh-phase6-finishing'),'phase 6 finishing version marker missing');
assert.ok(visual.includes('VISUAL REFRESH PHASE 6 — finishing and global polish'),'phase 6 CSS marker missing');
assert.ok(sync.includes("./js/core/visual-finishing.js"),'phase 6 finishing module must be loaded by RailOps');
assert.match(visual,/\.moverlay\s*\{[^}]*backdrop-filter:\s*blur\(8px\)[^}]*background:/s,'modal overlay must soften background context');
assert.match(visual,/\.alert-box\s*\{[^}]*min-height:\s*44px[^}]*border:\s*1px solid var\(--border\)[^}]*box-shadow:/s,'alerts must share a tactile premium surface');
assert.match(visual,/\.chips\s*\{[^}]*scroll-snap-type:\s*x proximity/s,'filter chips must scroll cleanly on mobile');
assert.match(visual,/\.chip\s*\{[^}]*min-height:\s*36px[^}]*display:\s*inline-flex[^}]*align-items:\s*center/s,'filter chips must have reliable touch targets');
assert.match(visual,/\.tab\s*\{[^}]*min-height:\s*42px[^}]*border-radius:\s*13px/s,'tabs must use the final touch-target geometry');
assert.match(visual,/\.empty-state\s*\{[^}]*text-align:\s*center[^}]*border:\s*1px dashed var\(--border\)/s,'empty states need a consistent presentation utility');

console.log('visual refresh phase 6 finishing contract: ok');
