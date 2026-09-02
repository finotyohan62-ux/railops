const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'railops.css'), 'utf8');
const compact = css.replace(/\s+/g, '');

const mobileRule = compact.match(/@media\(max-width:600px\)\{([^}]*)\}/);
if (!mobileRule) {
  console.error('FAIL: mobile CSS guard for narrow screens is missing');
  process.exit(1);
}

const mobileDeclarations = mobileRule[1];
if (!mobileDeclarations.includes('.fi{font-size:16px')) {
  console.error('FAIL: form inputs must keep a 16px mobile font size to avoid iOS focus zoom');
  process.exit(1);
}

console.log('PASS: mobile form inputs keep the 16px iOS focus-zoom guard');
