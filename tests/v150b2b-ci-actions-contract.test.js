const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

const actionUses = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)\s*$/gm)].map(match => match[1]);

assert.deepEqual(
  actionUses,
  ['actions/checkout@v4', 'actions/setup-node@v4'],
  'v150B-2B workflow must keep its action surface limited to official checkout and setup-node v4 actions'
);

assert.equal(
  new Set(actionUses).size,
  actionUses.length,
  'v150B-2B workflow must not duplicate action steps unnecessarily'
);

console.log('v150b2b CI actions contract: OK');
