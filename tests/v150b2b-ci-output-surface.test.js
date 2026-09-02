const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

assert.doesNotMatch(
  workflow,
  /uses:\s*actions\/upload-artifact@/i,
  'v150B-2B diagnostic CI must not publish repository contents as workflow artifacts'
);

assert.doesNotMatch(
  workflow,
  /uses:\s*actions\/cache@/i,
  'v150B-2B diagnostic CI must not create or mutate GitHub Actions caches'
);

assert.doesNotMatch(
  workflow,
  /uses:\s*actions\/download-artifact@/i,
  'v150B-2B diagnostic CI must not depend on mutable artifacts produced by another job or run'
);

console.log('v150b2b CI output surface: OK');
