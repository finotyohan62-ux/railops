const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const loader = fs.readFileSync(path.join(__dirname, '..', 'v150b2b-loader.js'), 'utf8');

assert.equal(
  /localStorage\.setItem\(\s*['"]ro3_u['"]/.test(loader),
  false,
  'secure loader must never persist the legacy user directory in ro3_u'
);
assert.match(
  loader,
  /localStorage\.removeItem\(\s*['"]ro3_u['"]\s*\)/,
  'secure loader must actively remove the legacy ro3_u cache'
);
assert.equal(
  /localStorage\.setItem\([^\n]*(?:password|motdepasse|mdp)/i.test(loader),
  false,
  'secure loader must never persist password-like fields in localStorage'
);
assert.equal(
  /JSON\.stringify\(\s*S\.users\s*\)/.test(loader),
  false,
  'secure loader must not serialize the in-memory user directory to localStorage'
);

console.log('PASS: v150B-2B local storage safety invariants');
