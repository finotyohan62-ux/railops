const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const worklogPath = path.join(root, 'docs', 'worklog-railops.md');
const appendDir = path.join(root, 'docs', 'worklog-railops-append');

const appendFiles = fs.readdirSync(appendDir)
  .filter(name => /^\d{4}-\d{2}-\d{2}-\d{4}\.md$/.test(name))
  .sort();

assert.ok(appendFiles.length > 0, 'at least one worklog append fragment must exist');

const latestName = appendFiles.at(-1);
const latest = fs.readFileSync(path.join(appendDir, latestName), 'utf8').trim();
const worklog = fs.readFileSync(worklogPath, 'utf8');
const heading = latest.split(/\r?\n/, 1)[0];

assert.ok(
  worklog.includes(heading),
  `primary worklog must include the latest append entry heading: ${heading}`
);

console.log(`PASS: primary worklog includes latest append entry ${latestName}`);
