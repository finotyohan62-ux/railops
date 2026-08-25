const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

assert(html.includes('href="./css/railops.css"'), 'index.html must load ./css/railops.css');
assert(fs.existsSync('css/railops.css'), 'css/railops.css must exist');
const css = fs.readFileSync('css/railops.css', 'utf8');
assert(css.trim().length > 1000, 'css/railops.css must contain the extracted application stylesheet');
assert(!/<style>[\s\S]*?<\/style>/i.test(html), 'the application stylesheet must no longer be inline in index.html');

assert(fs.existsSync('js/core/lifecycle.js'), 'js/core/lifecycle.js must exist');
assert(html.includes('id="railops-v155-lifecycle"'), 'index.html must keep the v155 lifecycle script marker');
assert(html.includes('src="./js/core/lifecycle.js"'), 'index.html must load the external v155 lifecycle core');
assert(!html.includes("const VERSION='155-lifecycle-cleanup';"), 'the v155 lifecycle implementation must no longer be inline');

console.log('modules refactor phase 2 invariants: OK');
