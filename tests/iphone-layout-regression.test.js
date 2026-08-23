const fs = require('fs');
const assert = require('assert');
const css = fs.readFileSync('css/railops.css','utf8');

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(escaped + '\\{([^}]*)\\}', 's'));
  assert(match, `missing CSS rule: ${selector}`);
  return match[1];
}
function hasAll(text, parts) {
  return parts.every(part => text.includes(part));
}

const app = rule('#app');
assert(!(app.includes('inset:0') && app.includes('width:100%')), '#app must not combine inset:0 with width:100% on iOS');
assert(hasAll(rule('html,body'), ['max-width:100%','overscroll-behavior-x:none']), 'root viewport must clamp horizontal overscroll');
assert(hasAll(app, ['left:0','right:0','min-width:0','max-width:100%']), '#app must be horizontally constrained');
assert(hasAll(rule('.screen'), ['min-width:0','max-width:100%','overflow-x:hidden']), 'screens must not widen the app');
assert(rule('.stat-grid').includes('grid-template-columns:minmax(0,1fr) minmax(0,1fr)'), 'stat grid tracks must be shrinkable');
assert(rule('.rg2').includes('grid-template-columns:minmax(0,1fr) minmax(0,1fr)'), 'two-column form grid tracks must be shrinkable');
assert(rule('.bnav').includes('safe-area-inset-bottom') && hasAll(rule('.ni'), ['min-width:0','min-height:44px']), 'bottom navigation must be safe-area aware and shrinkable');
assert(hasAll(rule('.nl'), ['white-space:nowrap','overflow:hidden']), 'bottom navigation labels must remain inside their tab');
assert(rule('.fab').includes('safe-area-inset-bottom'), 'floating action button must account for the iPhone home indicator');
assert(hasAll(rule('.msheet'), ['max-height:92dvh','safe-area-inset-bottom']), 'modal sheet must use dynamic viewport and bottom safe area');
assert(/@media \(max-width:600px\)\{\s*\.fi\{font-size:16px\}/s.test(css), 'mobile form fields must be 16px to prevent Safari focus zoom');

console.log('iPhone layout regression invariants: OK');
