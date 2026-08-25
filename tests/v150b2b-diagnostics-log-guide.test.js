const fs = require('fs');
const path = require('path');

const guide = fs.readFileSync(path.join(__dirname, '..', 'docs', 'v150b2b-diagnostics-guide.md'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

assert(
  guide.includes('## Lecture des logs Supabase'),
  'diagnostics guide must explain how to read Supabase logs safely'
);
assert(
  /fen[eê]tre[^\n]*24\s*h/i.test(guide),
  'diagnostics guide must state that connector logs cover a 24h window'
);
assert(
  /horodatage/i.test(guide) && /dernier/i.test(guide),
  'diagnostics guide must require comparing the latest matching error timestamp'
);
assert(
  /historique|ancien|ant[eé]rieur/i.test(guide) && /nouveau|r[eé]cent/i.test(guide),
  'diagnostics guide must distinguish historical errors from new errors'
);
assert(
  /logs seuls/i.test(guide) && /modifier/i.test(guide) && /policy/i.test(guide) && /permission/i.test(guide) && /RLS/.test(guide),
  'diagnostics guide must forbid security changes based on logs alone'
);

console.log('PASS: diagnostics guide documents safe Supabase log triage');
