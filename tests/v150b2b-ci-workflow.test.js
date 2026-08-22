const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

assert.match(workflow, /permissions:\s*\n\s+contents:\s*read\b/, 'CI must keep repository permissions read-only');
assert.match(workflow, /timeout-minutes:\s*5\b/, 'CI must keep a bounded job timeout');
assert.match(workflow, /run:\s*node tests\/run-v150b2b-checks\.js\b/, 'CI must execute the aggregate v150B-2B verification suite');
assert.match(workflow, /concurrency:\s*\n\s+group:\s*[^\n]+\n\s+cancel-in-progress:\s*true\b/, 'CI must cancel stale runs for the same branch or PR');

console.log('PASS: v150B-2B CI workflow safety contract');
