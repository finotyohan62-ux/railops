const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'docs', 'sql', '2026-09-11_atomic_scan_verification.sql');

if (!fs.existsSync(sqlPath)) {
  throw new Error('Missing atomic scan verification SQL migration');
}

const sql = fs.readFileSync(sqlPath, 'utf8');

const required = [
  /create\s+or\s+replace\s+function\s+public\.railops_upsert_scan\s*\(/i,
  /update\s+public\.materiels/i,
  /"verifLundi"/,
  /"verifSemaine"/,
  /presence\s*=\s*'confirme'/i,
  /etat\s*=\s*coalesce\s*\(/i,
  /scan\s*=\s*v_row\.date/i,
  /v_existing\.id\s+is\s+null/i,
  /weekKey/i,
];

for (const re of required) {
  if (!re.test(sql)) {
    throw new Error(`Atomic scan verification contract missing: ${re}`);
  }
}

if (/update\s+public\.materiels[\s\S]*where\s+reference\s*=/i.test(sql)) {
  throw new Error('Verification persistence must target the technical material id, not business reference');
}

console.log('scan verification contract: OK');
