const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflowPath = path.join(root, '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

const jobsSection = workflow.split(/^jobs:\s*$/m)[1] || '';

assert.ok(jobsSection, 'v150B-2B workflow must keep a jobs section');
assert.doesNotMatch(
  jobsSection,
  /^\s{4}permissions\s*:/m,
  'v150B-2B jobs must not override the global read-only permissions block'
);

console.log('v150b2b CI job permissions: OK');
