const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runnerPath = path.join(root, 'tests', 'run-v150b2b-checks.js');
const inventoryPath = path.join(root, 'docs', 'v150b2b-test-inventory.md');

const runner = fs.readFileSync(runnerPath, 'utf8');
const inventory = fs.readFileSync(inventoryPath, 'utf8');

const criticalBlock = runner.match(/const criticalTests = \[([\s\S]*?)\n\];/);
assert.ok(criticalBlock, 'runner must expose a criticalTests list');

const criticalTests = [...criticalBlock[1].matchAll(/'tests\/(v150b2b-[^']+\.test\.js)'/g)]
  .map(match => match[1]);

assert.ok(criticalTests.length > 0, 'runner must declare at least one critical regression guard');

for (const testName of criticalTests) {
  assert.ok(
    inventory.includes(`\`${testName}\``),
    `verification inventory must document critical runner guard: ${testName}`
  );
}

assert.match(
  inventory,
  /node tests\/run-v150b2b-checks\.js/,
  'verification inventory must keep the canonical local runner command'
);

console.log(`PASS: verification inventory documents ${criticalTests.length} critical runner guards`);
