const fs=require('fs');
const assert=require('assert');

const visual=fs.readFileSync('js/core/visual-finishing.js','utf8');

assert.ok(visual.includes('1.6-visual-audit-legacy-surfaces'),'visual audit marker missing');
assert.ok(visual.includes('VISUAL AUDIT — legacy surfaces'),'visual audit CSS marker missing');
assert.match(visual,/\.ro144-sheet\s*\{[^}]*border-radius:\s*24px 24px 0 0[^}]*box-shadow:/s,'register import sheet must match premium modal geometry');
assert.match(visual,/\.ro144-kpis>div\s*\{[^}]*border:\s*1px solid var\(--border\)[^}]*border-radius:\s*14px/s,'register KPI cards must be visually consistent');
assert.match(visual,/\.ro147-card\s*\{[^}]*border-radius:\s*16px[^}]*box-shadow:/s,'chef chantier cards must match refreshed cards');
assert.match(visual,/\.ro148-card\s*\{[^}]*border-radius:\s*16px[^}]*box-shadow:/s,'master chantier cards must match refreshed cards');
assert.match(visual,/\.ro147-back,\.ro148-back\s*\{[^}]*min-width:\s*40px[^}]*min-height:\s*40px/s,'legacy back controls need reliable touch targets');
assert.match(visual,/\.ro147-empty,\.ro148-empty\s*\{[^}]*border:\s*1px dashed var\(--border\)[^}]*border-radius:\s*16px/s,'legacy empty states must match final empty-state language');
assert.match(visual,/\.ro-v142-mc\s*\{[^}]*border-radius:\s*999px[^}]*font-weight:\s*700/s,'multi-chantier badge must match final pill language');

console.log('visual audit legacy surfaces contract: ok');
