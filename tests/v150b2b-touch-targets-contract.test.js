const fs = require('node:fs');
const path = require('node:path');

const cssPath = path.resolve(__dirname, '..', 'css', 'railops.css');
const css = fs.readFileSync(cssPath, 'utf8');

const touchTargets = [
  ['back button', '.tbk', 'min-width:44px', 'min-height:44px'],
  ['bottom navigation item', '.ni', 'min-height:44px'],
  ['radio-style control', '.ro', 'min-height:44px'],
  ['primary button', '.btn', 'min-height:44px'],
  ['filter chip', '.chip', 'min-height:44px'],
  ['tab control', '.tab', 'min-height:44px'],
  ['floating action button', '.fab', 'width:46px', 'height:46px'],
];

for (const [label, selector, ...requirements] of touchTargets) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escapedSelector}\\{([^}]*)\\}`));
  if (!match) {
    console.error(`FAIL: missing CSS rule for ${label} (${selector})`);
    process.exit(1);
  }
  for (const requirement of requirements) {
    if (!match[1].includes(requirement)) {
      console.error(`FAIL: ${label} (${selector}) must keep ${requirement}`);
      process.exit(1);
    }
  }
}

console.log('PASS: primary RailOps touch targets keep at least 44px hit areas');
