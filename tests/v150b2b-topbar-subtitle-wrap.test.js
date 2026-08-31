const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'railops.css'), 'utf8');
const rule = css.match(/\.tbs\{([^}]*)\}/);

if (!rule) {
  console.error('FAIL: .tbs topbar subtitle rule is missing');
  process.exit(1);
}

const declarations = rule[1].replace(/\s+/g, '');
if (!declarations.includes('overflow-wrap:anywhere')) {
  console.error('FAIL: .tbs must allow long subtitles to wrap instead of overflowing narrow screens');
  process.exit(1);
}

console.log('PASS: topbar subtitles can wrap safely on narrow screens');
