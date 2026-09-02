const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

const uses = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)\s*$/gm)].map(match => match[1]);
assert.ok(uses.length > 0, 'v150B-2B workflow must keep explicit action dependencies');

const allowedActions = new Set([
  'actions/checkout@v4',
  'actions/setup-node@v4',
]);

for (const action of uses) {
  assert.ok(
    allowedActions.has(action),
    `v150B-2B workflow action must stay on the reviewed allowlist: ${action}`
  );
  assert.match(
    action,
    /^actions\//,
    `v150B-2B workflow must not introduce third-party action provenance: ${action}`
  );
}

assert.deepEqual(
  [...new Set(uses)].sort(),
  [...allowedActions].sort(),
  'v150B-2B workflow must keep exactly the reviewed GitHub-owned action set'
);

console.log('v150b2b CI action provenance: OK');
