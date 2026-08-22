const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

assert.match(workflow, /permissions:\s*\n\s+contents:\s*read\b/, 'CI must keep repository permissions read-only');
assert.match(workflow, /timeout-minutes:\s*5\b/, 'CI must keep a bounded job timeout');
assert.match(workflow, /run:\s*node tests\/run-v150b2b-checks\.js\b/, 'CI must execute the aggregate v150B-2B verification suite');
assert.match(workflow, /concurrency:\s*\n\s+group:\s*[^\n]+\n\s+cancel-in-progress:\s*true\b/, 'CI must cancel stale runs for the same branch or PR');

const forbiddenMutationCommands = [
  /\bsupabase\s+(?:db\s+push|migration\s+up|functions\s+deploy|deploy)\b/i,
  /\bpsql\b[^\n]*(?:alter|create|delete|drop|grant|insert|revoke|truncate|update)\b/i,
];
for (const pattern of forbiddenMutationCommands) {
  assert.equal(
    pattern.test(workflow),
    false,
    `CI must remain diagnostic-only and never contain a mutation command matching ${pattern}`
  );
}

console.log('PASS: v150B-2B CI workflow safety contract');
