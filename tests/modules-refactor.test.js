const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

assert(html.includes('href="./css/railops.css"'), 'index.html must load ./css/railops.css');
assert(fs.existsSync('css/railops.css'), 'css/railops.css must exist');
const css = fs.readFileSync('css/railops.css', 'utf8');
assert(css.trim().length > 1000, 'css/railops.css must contain the extracted application stylesheet');
assert(!/<style>[\s\S]*?<\/style>/i.test(html), 'the application stylesheet must no longer be inline in index.html');
assert(html.includes('id="railops-v155-lifecycle"'), 'v155 lifecycle manager must remain present during CSS extraction');

console.log('modules refactor phase 1 invariants: OK');
