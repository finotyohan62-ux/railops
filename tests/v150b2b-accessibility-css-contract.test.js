const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const cssPath = path.resolve(__dirname, '..', 'css', 'railops.css');
const css = fs.readFileSync(cssPath, 'utf8');

assert.match(
  css,
  /button:focus-visible[\s\S]*?outline:\s*2px\s+solid\s+var\(--accent\)[\s\S]*?outline-offset:\s*2px/,
  'keyboard focus must stay visibly outlined with the RailOps accent',
);

const reducedMotion = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
assert.ok(reducedMotion, 'reduced-motion media query must remain present');
assert.match(reducedMotion[1], /animation:\s*none\s*!important/, 'reduced motion must disable animations');
assert.match(reducedMotion[1], /transition-duration:\s*0\.01ms\s*!important/, 'reduced motion must neutralize transitions');
assert.match(reducedMotion[1], /scroll-behavior:\s*auto\s*!important/, 'reduced motion must avoid smooth scrolling');

assert.match(
  css,
  /@media\s*\(max-width:\s*600px\)\s*\{\.fi\{font-size:\s*16px\}\}/,
  'mobile form controls must retain 16px text to avoid iOS input zoom',
);

console.log('PASS: RailOps accessibility CSS contract is preserved');
