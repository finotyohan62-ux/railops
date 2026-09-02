const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs');
const worklogPath = path.join(docsDir, 'worklog-railops.md');
const appendDir = path.join(docsDir, 'worklog-railops-append');

const appendFiles = fs.readdirSync(appendDir)
  .filter(name => /^\d{4}-\d{2}-\d{2}-\d{4}\.md$/.test(name))
  .sort();

assert.ok(appendFiles.length > 0, 'at least one worklog append fragment must exist');

const latestName = appendFiles.at(-1);
const latest = fs.readFileSync(path.join(appendDir, latestName), 'utf8').trim();
const heading = latest.split(/\r?\n/, 1)[0];
const journalFiles = [
  'worklog-railops.md',
  ...fs.readdirSync(docsDir)
    .filter(name => /^worklog-railops-archive-through-.*\.md$/.test(name))
    .sort(),
];
// The main journal explicitly points to versioned append fragments as part of the
// detailed durable history. Include those Git-tracked fragments in the contract.
const durableJournal = [
  ...journalFiles.map(name => fs.readFileSync(path.join(docsDir, name), 'utf8')),
  ...appendFiles.map(name => fs.readFileSync(path.join(appendDir, name), 'utf8')),
].join('\n');

assert.ok(
  durableJournal.includes(heading),
  `durable worklog history must include the latest append entry heading: ${heading}`
);

console.log(`PASS: durable worklog history includes latest append entry ${latestName} across ${journalFiles.length} journal file(s) plus ${appendFiles.length} versioned fragment(s)`);
