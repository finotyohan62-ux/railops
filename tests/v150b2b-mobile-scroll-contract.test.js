const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'railops.css'), 'utf8');
const compact = css.replace(/\s+/g, '');

const screenRule = compact.match(/\.screen\{([^}]*)\}/);
if (!screenRule) {
  console.error('FAIL: main scroll container CSS rule is missing');
  process.exit(1);
}

const declarations = screenRule[1];
const required = [
  'overflow-y:auto',
  'overflow-x:hidden',
  '-webkit-overflow-scrolling:touch',
];

for (const declaration of required) {
  if (!declarations.includes(declaration)) {
    console.error(`FAIL: .screen must keep ${declaration} for stable mobile scrolling`);
    process.exit(1);
  }
}

console.log('PASS: main screen keeps vertical touch scrolling and blocks horizontal drift');
