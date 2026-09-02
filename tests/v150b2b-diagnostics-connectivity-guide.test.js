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
  /CHEF_CHANTIER_STATS_MISSING/.test(guide),
  'diagnostics guide must document the missing Chef de chantier statistics warning'
);
assert(
  /online\s*===\s*true|explicitement\s+en\s+ligne|connectivit[eé]\s+explicitement\s+confirm[eé]e/i.test(guide),
  'diagnostics guide must state that missing Chef de chantier statistics require explicitly confirmed online connectivity'
);
assert(
  /connectivit[eé]\s+(?:est\s+)?(?:inconnue|ind[eé]termin[eé]e)|online\s*=\s*null/i.test(guide),
  'diagnostics guide must state that unknown connectivity does not trigger the server-statistics warning'
);

console.log('PASS: diagnostics guide documents confirmed and unknown connectivity semantics');
