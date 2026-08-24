const assert = require('node:assert/strict');
const { neutralizeLegacyHtml, formatLoadErrorHtml } = require('../v150b2b-harness-core.js');

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

{
  const html = formatLoadErrorHtml(new Error('<img src=x onerror=alert(1)>'));
  assert.match(html, /role="alert"/);
  assert.match(html, /aria-live="assertive"/);
  assert.match(html, /Réessayer/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/);
  assert.match(html, /min-height:100dvh/);
  assert.match(html, /padding-top:max\(20px,env\(safe-area-inset-top\)\)/);
  assert.match(html, /padding-bottom:max\(20px,env\(safe-area-inset-bottom\)\)/);
  assert.match(html, /background:#0f1117/);
}

{
  const html = formatLoadErrorHtml(new Error('bad "quoted" value'));
  assert.match(html, /bad &quot;quoted&quot; value/);
  assert.doesNotMatch(html, /bad "quoted" value/);
}

console.log('v150b2b harness core: OK');
