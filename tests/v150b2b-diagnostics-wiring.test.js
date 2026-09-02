const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const preview = fs.readFileSync(path.join(root, 'v150b2b-test.html'), 'utf8');

assert.equal(
  preview.includes('v150b2b-diagnostics.js'),
  true,
  'preview must inject the privacy-safe diagnostics helper'
);
assert.ok(
  preview.indexOf('v150b2b-loader.js') < preview.indexOf('v150b2b-diagnostics.js'),
  'diagnostics helper must load after the secure loader'
);

console.log('PASS: v150B-2B diagnostics helper is wired into preview');
