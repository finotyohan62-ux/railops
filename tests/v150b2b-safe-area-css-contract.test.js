const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const cssPath = path.resolve(__dirname, '..', 'css', 'railops.css');
const css = fs.readFileSync(cssPath, 'utf8');

assert.match(
  css,
  /#app\{[^}]*padding-left:env\(safe-area-inset-left,0px\)[^}]*padding-right:env\(safe-area-inset-right,0px\)[^}]*top:env\(safe-area-inset-top,0px\)/,
  'app shell must preserve iOS left/right/top safe-area insets',
);

assert.match(
  css,
  /\.bnav\{[^}]*padding:[^;}]*env\(safe-area-inset-bottom,12px\)/,
  'bottom navigation must preserve the iOS bottom safe area',
);

assert.match(
  css,
  /\.msheet\{[^}]*padding:[^;}]*env\(safe-area-inset-bottom,0px\)/,
  'modal sheets must keep content above the iOS home indicator',
);

assert.match(
  css,
  /\.fab\{[^}]*bottom:calc\(76px \+ env\(safe-area-inset-bottom,0px\)\)/,
  'floating action button must stay above the iOS bottom safe area',
);

console.log('PASS: RailOps iOS safe-area CSS contract is preserved');
