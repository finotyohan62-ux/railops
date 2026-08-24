const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const snapshotsDir = path.join(root, 'docs', 'supabase-state');
const snapshotFiles = fs.readdirSync(snapshotsDir)
  .filter(name => /^\d{4}-\d{2}-\d{2}-\d{4}\.md$/.test(name))
  .sort();

assert.ok(snapshotFiles.length > 0, 'at least one Supabase state snapshot must exist');

for (const name of snapshotFiles) {
  const match = name.match(/^(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})\.md$/);
  assert.ok(match, `snapshot ${name} must follow YYYY-MM-DD-HHMM.md`);

  const [, date, hour, minute] = match;
  const hh = Number(hour);
  const mm = Number(minute);
  assert.ok(hh >= 0 && hh <= 23, `snapshot ${name} must contain a valid hour`);
  assert.ok(mm >= 0 && mm <= 59, `snapshot ${name} must contain a valid minute`);

  const text = fs.readFileSync(path.join(snapshotsDir, name), 'utf8');
  const firstLine = text.split(/\r?\n/, 1)[0];
  const expectedTimestamp = `${date} ${hour}:${minute} Europe/Paris`;
  assert.ok(
    firstLine.includes(expectedTimestamp),
    `snapshot ${name} title must match its filename timestamp (${expectedTimestamp})`
  );
}

console.log(`v150b2b snapshot timestamps: OK (${snapshotFiles.length} snapshots checked)`);
