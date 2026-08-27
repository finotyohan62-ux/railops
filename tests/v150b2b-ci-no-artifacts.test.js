const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

assert.doesNotMatch(
  workflow,
  /uses:\s*actions\/(?:upload|download)-artifact@/i,
  'v150B-2B checks must not upload or download workflow artifacts'
);

assert.doesNotMatch(
  workflow,
  /uses:\s*[^\n]*artifact[^\n]*@/i,
  'v150B-2B checks must not introduce third-party artifact transfer actions'
);

console.log('v150b2b CI artifact isolation: OK');
