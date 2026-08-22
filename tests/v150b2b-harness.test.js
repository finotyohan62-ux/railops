const fs = require('fs');
const path = require('path');

const harnessPath = process.argv[2] || path.join(__dirname, '..', 'v150b2b-test.html');
const html = fs.readFileSync(harnessPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
}

assert(
  html.includes('<script src="./v150b2b-harness-core.js?build=150b2b11"></script>'),
  'test page must load the extracted harness core'
);
assert(
  html.includes("if(!globalThis.RailOpsHarness150B2B)throw new Error('HARNESS_CORE_NOT_LOADED')"),
  'test page must fail closed when the harness core is unavailable'
);
assert(
  html.includes('RailOpsHarness150B2B.neutralizeLegacyHtml(await r.text())'),
  'test page must pass the legacy HTML through the tested neutralizer'
);
assert(
  html.includes('<pre role="alert" aria-live="assertive"'),
  'preview load failures must be announced accessibly'
);
for (const adapter of [
  'v150b2b-loader.js',
  'v150b2b-diagnostics.js',
  'v150b2b-chef-chantier-stats.js',
  'v150b2b-owner-mode.js',
  'v150b2b-secure-admin.js',
  'v150b2b-secure-delete.js',
  'v150b2b-maintenance.js'
]) {
  assert(html.includes(adapter + '?build=150b2b11'), `test page must inject ${adapter}`);
}

console.log('PASS: v150B-2B harness integration wiring is present');
