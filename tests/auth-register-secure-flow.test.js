const fs = require('fs');
const assert = require('assert');

const adapter = fs.readFileSync('js/core/secure-register.js', 'utf8');
const sync = fs.readFileSync('js/core/sync.js', 'utf8');

assert.match(adapter,/const VERSION='156-secure-registration'/,'secure registration adapter must be versioned');
assert.match(adapter,/db\.functions\.invoke\('railops-register'/,'registration must call the railops-register Edge Function');
assert.match(adapter,/db\.auth\.setSession\(\{access_token:data\.session\.access_token,refresh_token:data\.session\.refresh_token\}\)/,'registration must install the returned Supabase Auth session');
assert.match(adapter,/doInscription=railopsSecureRegistration/,'secure registration adapter must replace the legacy doInscription handler');
assert.doesNotMatch(adapter,/\.from\(['"]users['"]\)\s*\.\s*(?:insert|upsert)\s*\(/,'secure registration adapter must never write directly to public.users');
assert.match(sync,/\.\/js\/core\/secure-register\.js/,'sync bootstrap must load the secure registration adapter');

console.log('auth-register-secure-flow.test.js: OK');
