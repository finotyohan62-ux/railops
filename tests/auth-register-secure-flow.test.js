const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

assert.match(
  html,
  /const VERSION='156-secure-registration'/,
  'index.html must install the secure registration adapter'
);
assert.match(
  html,
  /db\.functions\.invoke\('railops-register'/,
  'registration must call the railops-register Edge Function'
);
assert.match(
  html,
  /db\.auth\.setSession\(\{access_token:data\.session\.access_token,refresh_token:data\.session\.refresh_token\}\)/,
  'registration must install the returned Supabase Auth session'
);
assert.match(
  html,
  /doInscription=railopsSecureRegistration/,
  'the secure registration adapter must replace the legacy doInscription handler'
);

const adapter = html.match(/<script id="railops-v156-secure-registration">([\s\S]*?)<\/script>/)?.[1] || '';
assert.ok(adapter, 'secure registration adapter block must exist');
assert.doesNotMatch(
  adapter,
  /\.from\(['"]users['"]\)\s*\.\s*(?:insert|upsert)\s*\(/,
  'secure registration adapter must never write directly to public.users'
);

console.log('auth-register-secure-flow.test.js: OK');
