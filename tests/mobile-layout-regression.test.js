const fs = require('fs');
const assert = require('assert');

const css = fs.readFileSync(process.argv[2] || 'css/railops.css', 'utf8');

function expectRule(pattern, message) {
  assert(pattern.test(css), message);
}

expectRule(/html,body\{[^}]*max-width:100%[^}]*overflow:hidden[^}]*overscroll-behavior-x:none[^}]*\}/,
  'root viewport must be width-contained and block horizontal overscroll chaining');
expectRule(/#app\{[^}]*top:env\(safe-area-inset-top,0px\)[^}]*right:0[^}]*bottom:0[^}]*left:0[^}]*min-width:0[^}]*max-width:100%[^}]*padding-left:env\(safe-area-inset-left,0px\)[^}]*padding-right:env\(safe-area-inset-right,0px\)[^}]*\}/,
  '#app must use edge constraints plus safe-area padding without a competing width:100%');
expectRule(/\.screen\{[^}]*min-width:0[^}]*width:100%[^}]*max-width:100%[^}]*overflow-x:hidden[^}]*overscroll-behavior-x:none[^}]*\}/,
  'screen containers must not expand beyond the mobile viewport');
expectRule(/\.sb \.t\{[^}]*min-width:0[^}]*overflow:hidden[^}]*text-overflow:ellipsis[^}]*white-space:nowrap[^}]*\}/,
  'status-bar title must be shrinkable');
expectRule(/\.sb \.r\{[^}]*min-width:0[^}]*overflow:hidden[^}]*text-overflow:ellipsis[^}]*white-space:nowrap[^}]*\}/,
  'status-bar right text must be shrinkable');
expectRule(/\.alert-box\{[^}]*min-width:0[^}]*\}/,
  'alert flex container must permit shrinking');
expectRule(/\.at\{[^}]*min-width:0[^}]*overflow-wrap:anywhere[^}]*\}/,
  'alert text must wrap long unbroken references');
expectRule(/\.stat-grid\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)[^}]*\}/,
  'stat grid tracks must not use intrinsic min-content widths');
expectRule(/\.stat-card\{[^}]*min-width:0[^}]*overflow-wrap:anywhere[^}]*\}/,
  'stat cards must contain long unbroken references');
expectRule(/\.rg2\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)[^}]*\}/,
  'two-column form grid tracks must be shrinkable');
expectRule(/\.rg2>\*\{[^}]*min-width:0[^}]*overflow-wrap:anywhere[^}]*\}/,
  'two-column form grid children must contain long content');
expectRule(/\.chips\{[^}]*overflow-x:auto[^}]*\}/,
  'chips must keep their intentional local horizontal scrolling');
expectRule(/@media \(max-width:600px\)\{\s*\.fi\{font-size:16px\}\s*\}/,
  'mobile form fields must use 16px text to avoid browser focus zoom');

console.log('mobile layout regression invariants: OK');
