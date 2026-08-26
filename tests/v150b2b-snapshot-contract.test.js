const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const snapshotsDir = path.join(root, 'docs', 'supabase-state');
const snapshotFiles = fs.readdirSync(snapshotsDir)
  .filter(name => /^\d{4}-\d{2}-\d{2}-\d{4}\.md$/.test(name))
  .sort();

assert.ok(snapshotFiles.length > 0, 'at least one GitHub/Supabase snapshot must exist');

const latestName = snapshotFiles.at(-1);
const latest = fs.readFileSync(path.join(snapshotsDir, latestName), 'utf8');

const requiredMarkers = [
  '# RailOps — état GitHub / Supabase',
  'strictement en lecture seule',
  '## GitHub',
  '## Supabase',
  '### RLS / policies — lecture seule',
  '### Security Advisor',
  '### Performance Advisor',
  '## Diagnostic',
  '## Garde-fous',
  '`security/v150b2b-rls-ready`',
  'aucun merge, rebase ou changement de `main`',
];

for (const marker of requiredMarkers) {
  assert.ok(
    latest.includes(marker),
    `latest snapshot ${latestName} must include diagnostic contract marker: ${marker}`
  );
}

assert.match(
  latest,
  /\*\*\d+ commits? behind \/ \d+ ahead\*\*/,
  `latest snapshot ${latestName} must record fresh branch divergence`
);

assert.match(
  latest,
  /Projet : `railops` \(`[^`]+`\)/,
  `latest snapshot ${latestName} must identify the inspected Supabase project without credentials`
);

const coreTables = [
  'agents',
  'chantiers',
  'deleted_ids',
  'inspections',
  'materiels',
  'prix_catalogue',
  'scans',
  'users',
];
for (const table of coreTables) {
  assert.match(
    latest,
    new RegExp('- `' + table + '` : \\d+\\s*[;.]'),
    `latest snapshot ${latestName} must record the RLS policy count for core table ${table}`
  );
}

assert.match(
  latest,
  /Ces alertes restent des signaux de diagnostic uniquement\./,
  `latest snapshot ${latestName} must label Advisor findings as diagnostic signals only`
);
assert.match(
  latest,
  /Aucune permission, fonction, policy, Auth ou RLS n'est modifiée automatiquement\./,
  `latest snapshot ${latestName} must explicitly prohibit automatic security remediation`
);
assert.match(
  latest,
  /Aucun index ni changement de schéma n'est appliqué\./,
  `latest snapshot ${latestName} must explicitly prohibit automatic performance-schema remediation`
);

console.log(`v150b2b snapshot contract: OK (${latestName})`);
