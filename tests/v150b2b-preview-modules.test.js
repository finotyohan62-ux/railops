const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const helperPath = path.join(__dirname, 'v150b2b-preview-modules.js');

assert.equal(
  fs.existsSync(helperPath),
  true,
  'preview module discovery must be centralized in tests/v150b2b-preview-modules.js'
);

const { extractPreviewModules } = require(helperPath);

const fixture = `<script src="./v150b2b-loader.js?build=1"></script>
<script src="./v150b2b-chef-chantier-stats.js?build=1"></script>
<script src="./v150b2b-loader.js?build=1"></script>`;

assert.deepEqual(
  extractPreviewModules(fixture),
  ['v150b2b-chef-chantier-stats.js', 'v150b2b-loader.js'],
  'preview module discovery must deduplicate and sort injected v150B-2B modules'
);

assert.deepEqual(
  extractPreviewModules('<script src="./other.js"></script>'),
  [],
  'non v150B-2B scripts must be ignored'
);

console.log('PASS: v150B-2B preview module discovery');
