const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'railops.css'), 'utf8');
const infoRule = css.match(/\.tbi\{([^}]*)\}/);
const titleRule = css.match(/\.tbt\{([^}]*)\}/);

if (!infoRule) {
  console.error('FAIL: .tbi topbar info rule is missing');
  process.exit(1);
}
if (!titleRule) {
  console.error('FAIL: .tbt topbar title rule is missing');
  process.exit(1);
}

const infoDeclarations = infoRule[1].replace(/\s+/g, '');
const titleDeclarations = titleRule[1].replace(/\s+/g, '');

if (!infoDeclarations.includes('min-width:0')) {
  console.error('FAIL: .tbi must be allowed to shrink inside the topbar');
  process.exit(1);
}
for (const declaration of ['white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis']) {
  if (!titleDeclarations.includes(declaration)) {
    console.error(`FAIL: .tbt must preserve ${declaration} for long titles on narrow screens`);
    process.exit(1);
  }
}

console.log('PASS: long topbar titles stay contained with ellipsis on narrow screens');
