const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const corePath = 'js/legacy-core.js';

assert(fs.existsSync(corePath), 'js/legacy-core.js must exist');
assert(
  html.includes('<script id="railops-legacy-core" src="./js/legacy-core.js"></script>'),
  'index.html must load the extracted legacy core at the original script position'
);
assert(!html.includes('<script>const a0ax=a0b;'), 'the historical core must no longer remain inline');

const core = fs.readFileSync(corePath, 'utf8');
assert(core.includes('const a0ax=a0b;'), 'legacy core marker is missing');
assert(core.includes("const OFFLINE_KEY='ro_offline_queue';"), 'offline queue logic must remain in the extracted core');
assert(core.includes('const S='), 'application state must remain in the extracted core during physical extraction');
assert(core.includes('createClient(SUPA_URL,SUPA_KEY)'), 'Supabase client initialization must remain in the extracted core');
assert(core.length > 100000, 'legacy core extraction is unexpectedly small');

console.log('legacy core extraction invariants: OK');
