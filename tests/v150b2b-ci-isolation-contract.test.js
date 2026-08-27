const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

assert.match(
  workflow,
  /jobs:\s*[\s\S]*?checks:\s*[\s\S]*?runs-on:\s*ubuntu-latest\b/,
  'v150B-2B diagnostic checks must stay on the expected GitHub-hosted Ubuntu runner'
);
assert.doesNotMatch(
  workflow,
  /^\s+container\s*:/m,
  'v150B-2B diagnostic checks must not introduce a job container'
);
assert.doesNotMatch(
  workflow,
  /^\s+services\s*:/m,
  'v150B-2B diagnostic checks must not introduce service containers'
);
assert.doesNotMatch(
  workflow,
  /uses:\s*docker:\/\//i,
  'v150B-2B diagnostic checks must not execute Docker action images'
);

console.log('v150b2b CI isolation contract: OK');
