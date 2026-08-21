const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tests = [
  'tests/v150b2b-harness-core.test.js',
  'tests/v150b2b-harness.test.js',
  'tests/v150b2b-chef-chantier-stats.test.js',
  'tests/v150b2b-chef-chantier-integration.test.js',
];
const syntaxTargets = [
  'v150b2b-harness-core.js',
  'v150b2b-chef-chantier-stats.js',
  'v150b2b-loader.js',
  'v150b2b-maintenance.js',
  'v150b2b-owner-mode.js',
  'v150b2b-secure-admin.js',
  'v150b2b-secure-delete.js',
];

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

console.log('\nPASS: all v150B-2B local checks completed');
