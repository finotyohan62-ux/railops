const fs=require('fs');
const assert=require('assert');

const visual=fs.readFileSync('js/core/visual-refresh.js','utf8');

assert.ok(visual.includes('VISUAL REFRESH PHASE 4 — chantier and detail surfaces'),'phase 4 marker missing');
assert.match(visual,/\.cc\s*\{[^}]*position:\s*relative[^}]*overflow:\s*hidden/s,'chantier cards need a structured premium surface');
assert.match(visual,/\.cc::before\s*\{[^}]*width:\s*4px[^}]*background:\s*var\(--accent\)/s,'chantier cards need an accent rail');
assert.match(visual,/\.cc::after\s*\{[^}]*content:\s*'›'/s,'chantier cards need a clear affordance');
assert.match(visual,/\.cc\s+\.it\s*\{[^}]*font-size:\s*15px[^}]*font-weight:\s*750/s,'chantier title hierarchy missing');
assert.match(visual,/\.cc\s+\.is\s*\{[^}]*line-height:\s*1\.4/s,'chantier secondary information must be easier to read');
assert.match(visual,/\.cc\s+\.badge\s*\{[^}]*padding:\s*5px\s+9px/s,'chantier status badges need consistent density');
assert.match(visual,/\.cc\s+\.pbar\s*\{[^}]*height:\s*6px/s,'chantier progress must be easier to read');
assert.match(visual,/\.msheet\s+\.sec\s*\{[^}]*padding-left:\s*0/s,'detail-sheet section headings should align with content');
assert.match(visual,/\.msheet\s+\.li\s*\{[^}]*min-height:\s*52px/s,'detail-sheet rows need touch-friendly height');
assert.ok(visual.includes('@media (max-width:380px)'),'small-phone fallback must remain present');

for(const forbidden of ['db.','supabase','rpc(','saveChantier(','saveOfflineQueue','addToOfflineQueue']){
  assert.ok(!visual.includes(forbidden),`visual refresh must not touch ${forbidden}`);
}

console.log('visual refresh phase 4 chantier contract: ok');
