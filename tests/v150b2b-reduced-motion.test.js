const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'railops.css'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

assert(/@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(css), 'reduced-motion media query is required');
assert(/animation\s*:\s*none\s*!important/i.test(css), 'reduced-motion mode must disable decorative animations');
assert(/transition-duration\s*:\s*0\.01ms\s*!important/i.test(css), 'reduced-motion mode must minimize transitions');

console.log('PASS: reduced-motion accessibility contract');
