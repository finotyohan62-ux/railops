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
  html.includes("if(start<0||end<0)throw new Error('LEGACY_BOOTSTRAP_NOT_FOUND')"),
  'harness must fail closed when the legacy bootstrap cannot be located'
);
assert(
  html.includes("const silentMarker='async function silentSync(){'"),
  'harness must locate silentSync explicitly'
);
assert(
  html.includes("if(!html.includes(silentMarker))throw new Error('LEGACY_SILENT_SYNC_NOT_FOUND')"),
  'harness must fail closed when silentSync is missing'
);
assert(
  html.includes("html=html.replace(silentMarker,silentMarker+'return;')"),
  'harness must neutralize the located silentSync marker'
);

console.log('PASS: v150B-2B harness fail-closed guards are present');
