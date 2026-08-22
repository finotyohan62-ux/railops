const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const previewPath = path.join(root, 'v150b2b-test.html');
const preview = fs.readFileSync(previewPath, 'utf8');

const tests = fs.readdirSync(__dirname)
  .filter(name => /^v150b2b-.*\.test\.js$/i.test(name))
  .sort()
  .map(name => `tests/${name}`);

const syntaxTargets = [...new Set(
  [...preview.matchAll(/\.\/(v150b2b-[a-z0-9-]+\.js)\?build=/gi)]
    .map(match => match[1])
)].sort();

if (!tests.length) {
  console.error('FAIL: no v150B-2B tests discovered');
  process.exit(1);
}
if (!syntaxTargets.length) {
  console.error('FAIL: no v150B-2B preview modules discovered');
  process.exit(1);
}

function run(label, args) {
  process.stdout.write(`\n▶ ${label}\n`);
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

for (const test of tests) run(test, [test]);
for (const target of syntaxTargets) run(`node --check ${target}`, ['--check', target]);

console.log(`\nPASS: all v150B-2B local checks completed (${tests.length} tests, ${syntaxTargets.length} syntax targets)`);
