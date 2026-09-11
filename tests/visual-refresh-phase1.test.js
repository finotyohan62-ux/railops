const fs=require('fs');
const assert=require('assert');

const css=fs.readFileSync('css/railops.css','utf8');

assert.ok(css.includes('/* VISUAL REFRESH PHASE 1 */'),'visual refresh phase 1 marker missing');
assert.match(css,/\.topbar\s*\{[^}]*min-height:\s*64px/s,'topbar must keep a stable premium mobile height');
assert.match(css,/\.btn\s*\{[^}]*min-height:\s*48px/s,'primary buttons need a 48px touch target');
assert.match(css,/\.ni\s*\{[^}]*min-height:\s*48px/s,'bottom navigation items need a 48px touch target');
assert.match(css,/\.card\s*\{[^}]*box-shadow:/s,'cards must have the new visual depth');
assert.match(css,/\.stat-card\s*\{[^}]*box-shadow:/s,'dashboard stat cards must use the new visual depth');
assert.match(css,/\.cc\s*\{[^}]*box-shadow:/s,'chantier cards must use the new visual depth');
assert.ok(css.includes('@media (prefers-reduced-motion: reduce)'),'reduced-motion accessibility fallback missing');
assert.match(css,/\.theme-railops\s*\{[^}]*--accent:\s*#F47920/i,'RailOps orange must remain the main action accent');

console.log('visual refresh phase 1 contract: ok');
