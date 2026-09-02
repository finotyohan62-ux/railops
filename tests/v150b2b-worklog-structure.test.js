const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const worklogPath = path.join(root, 'docs', 'worklog-railops.md');
const appendDir = path.join(root, 'docs', 'worklog-railops-append');

assert.ok(fs.existsSync(worklogPath), 'docs/worklog-railops.md must exist');
assert.ok(fs.existsSync(appendDir), 'docs/worklog-railops-append must exist');

const mainWorklog = fs.readFileSync(worklogPath, 'utf8');
assert.match(mainWorklog, /^# RailOps — journal de travail\s*$/m, 'main worklog title is missing');

const fragments = fs.readdirSync(appendDir)
  .filter(name => name.endsWith('.md'))
  .sort();

assert.ok(fragments.length > 0, 'at least one worklog append fragment is expected');

for (const name of fragments) {
  const match = /^(\d{4}-\d{2}-\d{2})-(\d{4})(?:\.note)?\.md$/.exec(name);
  assert.ok(match, `invalid worklog append filename: ${name}`);

  const [, date, hhmm] = match;
  const hour = Number(hhmm.slice(0, 2));
  const minute = Number(hhmm.slice(2));
  assert.ok(hour >= 0 && hour <= 23, `invalid hour in worklog append filename: ${name}`);
  assert.ok(minute >= 0 && minute <= 59, `invalid minute in worklog append filename: ${name}`);

  const content = fs.readFileSync(path.join(appendDir, name), 'utf8');
  const heading = content.match(/^## (\d{4}-\d{2}-\d{2})\b/m);
  assert.ok(heading, `dated level-2 heading missing in ${name}`);
  assert.equal(heading[1], date, `filename/header date mismatch in ${name}`);
}

console.log(`PASS: worklog structure (${fragments.length} append fragments checked)`);
