const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'v150b2b-checks.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

if (!/^concurrency:\s*$/m.test(workflow)) {
  fail('diagnostic workflow must declare a concurrency policy');
}

if (!/^\s+cancel-in-progress:\s*true\s*$/m.test(workflow)) {
  fail('diagnostic workflow must cancel obsolete in-progress runs');
}

const timeoutMatch = workflow.match(/^\s+timeout-minutes:\s*(\d+)\s*$/m);
if (!timeoutMatch) {
  fail('checks job must declare timeout-minutes');
}

const timeoutMinutes = Number(timeoutMatch[1]);
if (!Number.isInteger(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > 10) {
  fail(`checks job timeout must stay between 1 and 10 minutes (found ${timeoutMatch[1]})`);
}

if (!/^\s+group:\s+v150b2b-\$\{\{\s*github\.workflow\s*\}\}-\$\{\{\s*github\.event\.pull_request\.number\s*\|\|\s*github\.ref\s*\}\}\s*$/m.test(workflow)) {
  fail('concurrency group must remain scoped by workflow and PR/ref');
}

console.log(`PASS: diagnostic CI resource bounds are explicit (timeout=${timeoutMinutes}m, cancel-in-progress=true)`);
