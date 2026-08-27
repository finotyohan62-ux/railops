const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { extractPreviewModules } = require('./v150b2b-preview-modules.js');

const root = path.resolve(__dirname, '..');
const previewPath = path.join(root, 'v150b2b-test.html');
const preview = fs.readFileSync(previewPath, 'utf8');
const CHECK_TIMEOUT_MS = 30000;
const runRef = process.env.GITHUB_REF_NAME || 'local';
const runSha = process.env.GITHUB_SHA?.slice(0, 12) || 'local';
const runEvent = process.env.GITHUB_EVENT_NAME || 'local';
const runId = process.env.GITHUB_RUN_ID || 'local';
const failures = [];
const durations = [];

const tests = fs.readdirSync(__dirname)
  .filter(name => /^v150b2b-.*\.test\.js$/i.test(name))
  .sort()
  .map(name => `tests/${name}`);

const criticalTests = [
  'tests/v150b2b-agent-material-save-regression.test.js',
  'tests/v150b2b-ci-branch-safety.test.js',
  'tests/v150b2b-ci-isolation-contract.test.js',
  'tests/v150b2b-ci-job-permissions.test.js',
  'tests/v150b2b-ci-nonmutation.test.js',
  'tests/v150b2b-static-invariants.test.js',
];

const syntaxTargets = extractPreviewModules(preview);

if (!tests.length) {
  console.error('FAIL: no v150B-2B tests discovered');
  process.exit(1);
}
for (const criticalTest of criticalTests) {
  if (!tests.includes(criticalTest)) {
    console.error(`FAIL: critical v150B-2B regression guard is not discovered: ${criticalTest}`);
    process.exit(1);
  }
}
if (!syntaxTargets.length) {
  console.error('FAIL: no v150B-2B preview modules discovered');
  process.exit(1);
}

console.log(`ℹ v150B-2B checks context: node=${process.version} ref=${runRef} sha=${runSha} event=${runEvent} run=${runId}`);
console.log(`ℹ discovered checks: ${tests.length} tests, ${syntaxTargets.length} syntax targets`);
console.log(`ℹ critical regression guards: ${criticalTests.length}/${criticalTests.length} discovered`);

function run(label, args) {
  process.stdout.write(`\n▶ ${label}\n`);
  const startedAt = Date.now();
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
    timeout: CHECK_TIMEOUT_MS,
  });
  const elapsedMs = Date.now() - startedAt;
  durations.push({ label, elapsedMs });
  if (result.error?.code === 'ETIMEDOUT') {
    console.error(`FAIL: ${label} timed out after ${CHECK_TIMEOUT_MS}ms`);
    failures.push({ label, reason: 'timeout' });
    return false;
  }
  if (result.error) {
    console.error(`FAIL: ${label} could not start`);
    console.error(result.error);
    failures.push({ label, reason: result.error.code || 'spawn-error' });
    return false;
  }
  if (result.status !== 0) {
    console.error(`FAIL: ${label} exited with code ${result.status ?? 1}`);
    failures.push({ label, reason: `exit-${result.status ?? 1}` });
    return false;
  }
  console.log(`PASS: ${label} (${elapsedMs}ms)`);
  return true;
}

for (const test of tests) run(test, [test]);
for (const target of syntaxTargets) run(`node --check ${target}`, ['--check', target]);

const slowest = [...durations].sort((a,b)=>b.elapsedMs-a.elapsedMs).slice(0,3);
if (slowest.length) {
  console.log(`\nℹ slowest checks: ${slowest.map(item => `${item.label} (${item.elapsedMs}ms)`).join(' · ')}`);
}
const totalElapsedMs = durations.reduce((sum,item)=>sum+item.elapsedMs,0);
const passedChecks = Math.max(0, durations.length - failures.length);
const failureReasonCounts = failures.reduce((counts, failure) => {
  counts[failure.reason] = (counts[failure.reason] || 0) + 1;
  return counts;
}, {});
const failureReasonSummary = Object.entries(failureReasonCounts)
  .sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]))
  .map(([reason,count])=>`${reason}=${count}`)
  .join(' · ');
console.log(`ℹ total check time: ${totalElapsedMs}ms`);
console.log(`ℹ passed checks: ${passedChecks}/${durations.length}`);
if (failureReasonSummary) console.log(`ℹ failure reasons: ${failureReasonSummary}`);

function writeStepSummary() {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  const status = failures.length ? '❌ Failed' : '✅ Passed';
  const lines = [
    '## v150B-2B verification summary',
    '',
    `- Status: **${status}**`,
    `- Tests: **${tests.length}**`,
    `- Critical regression guards: **${criticalTests.length}/${criticalTests.length}**`,
    `- Syntax targets: **${syntaxTargets.length}**`,
    `- Passed checks: **${passedChecks}/${durations.length}**`,
    `- Failures: **${failures.length}**`,
    `- Total check time: **${totalElapsedMs}ms**`,
    `- Node: \`${process.version}\``,
    `- Ref: \`${runRef}\``,
    `- SHA: \`${runSha}\``,
    `- Event: \`${runEvent}\``,
    `- Run ID: \`${runId}\``,
  ];
  if (slowest.length) lines.push(`- Slowest: ${slowest.map(item => `\`${item.label}\` (${item.elapsedMs}ms)`).join(' · ')}`);
  if (failureReasonSummary) lines.push(`- Failure reasons: \`${failureReasonSummary}\``);
  if (failures.length) {
    lines.push('', '### Failures');
    for (const failure of failures) lines.push(`- \`${failure.label}\`: ${failure.reason}`);
  }
  try {
    fs.appendFileSync(summaryPath, `${lines.join('\n')}\n`);
  } catch (error) {
    console.warn(`WARN: could not write GitHub step summary: ${error?.message || error}`);
  }
}

writeStepSummary();

if (failures.length) {
  console.error(`\nFAIL: ${failures.length} v150B-2B check(s) failed`);
  for (const failure of failures) console.error(` - ${failure.label}: ${failure.reason}`);
  process.exit(1);
}

console.log(`\nPASS: all v150B-2B local checks completed (${tests.length} tests, ${syntaxTargets.length} syntax targets)`);
