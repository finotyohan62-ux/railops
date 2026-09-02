const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.resolve(__dirname, '..', 'css', 'railops.css');
const css = fs.readFileSync(cssPath, 'utf8');

const match = css.match(/\.at\{([^}]*)\}/);
if (!match) {
  console.error('FAIL: missing .at alert text CSS rule');
  process.exit(1);
}

for (const requirement of ['min-width:0', 'overflow-wrap:anywhere']) {
  if (!match[1].includes(requirement)) {
    console.error(`FAIL: alert text must keep ${requirement} to prevent long diagnostics from forcing horizontal overflow`);
    process.exit(1);
  }
}

console.log('PASS: alert text can wrap long diagnostics without forcing horizontal overflow');
