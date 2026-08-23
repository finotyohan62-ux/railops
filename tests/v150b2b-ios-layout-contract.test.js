const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

assert.match(
  html,
  /<meta\s+name="viewport"\s+content="[^"]*width=device-width[^"]*viewport-fit=cover[^"]*">/i,
  'iPhone layout must keep viewport-fit=cover so safe-area insets are exposed'
);

assert.doesNotMatch(
  html,
  /user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0+)?/i,
  'mobile viewport must not disable user zoom'
);

assert.match(
  html,
  /#app\{[^}]*padding-left:env\(safe-area-inset-left,0px\)[^}]*padding-right:env\(safe-area-inset-right,0px\)[^}]*top:env\(safe-area-inset-top,0px\)/i,
  'app shell must preserve iPhone top and side safe areas'
);

assert.match(
  html,
  /\.bnav\{[^}]*padding:[^;}]*env\(safe-area-inset-bottom,12px\)/i,
  'bottom navigation must preserve the iPhone home-indicator safe area'
);

assert.match(
  html,
  /\.screen\{[^}]*overflow-y:auto[^}]*-webkit-overflow-scrolling:touch/i,
  'scrollable screens must preserve momentum scrolling on iOS'
);

console.log('PASS: iPhone/mobile layout safety contract is preserved');
