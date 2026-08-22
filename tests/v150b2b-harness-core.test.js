const assert = require('node:assert/strict');
const { neutralizeLegacyHtml } = require('../v150b2b-harness-core.js');

function fixture({ load = true, silentSync = true } = {}) {
  return `<!doctype html><body><script>\n${load ? 'async function load(){LEGACY_LOAD_BODY}function eL(' : 'function eL('}\n${silentSync ? 'async function silentSync(){LEGACY_SYNC_BODY}' : 'function otherSync(){LEGACY_SYNC_BODY}'}\n</script></body>`;
}

{
  const out = neutralizeLegacyHtml(fixture());
  assert.match(out, /async function load\(\)\{return;\}function eL\(/);
  assert.match(out, /async function silentSync\(\)\{return;/);
  assert.doesNotMatch(out, /LEGACY_LOAD_BODY/);
}

assert.throws(
  () => neutralizeLegacyHtml(fixture({ load: false })),
  /LEGACY_BOOTSTRAP_NOT_FOUND/
);

assert.throws(
  () => neutralizeLegacyHtml(fixture({ silentSync: false })),
  /LEGACY_SILENT_SYNC_NOT_FOUND/
);

console.log('v150b2b harness core: OK');
