const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const checklistPath = path.join(root, 'docs', 'v150b2b-safe-change-checklist.md');

assert.ok(fs.existsSync(checklistPath), 'safe-change checklist must exist');
const checklist = fs.readFileSync(checklistPath, 'utf8');

const requiredSignals = [
  'security/v150b2b-rls-ready',
  'SHA actuel de `main`',
  'merge-base',
  'behind/ahead',
  'ne jamais les intégrer automatiquement',
  'lecture seule',
  'règle métier',
  'permission applicative',
  'Multi-chantier',
  'purge de vérification hebdomadaire',
  'Refuser tout merge, rebase, cherry-pick, déploiement production, migration, activation de RLS forcée ou mutation de données',
  'v150B-2B checks',
  'Vérifier à nouveau que `main` n\'a pas bougé',
  'docs/worklog-railops.md',
];

for (const signal of requiredSignals) {
  assert.ok(
    checklist.includes(signal),
    `safe-change checklist lost required safety signal: ${signal}`,
  );
}

assert.match(
  checklist,
  /En cas de doute sur l'impact produit, sécurité, données ou permissions, ne pas appliquer le changement/i,
  'safe-change checklist must preserve the stop-on-ambiguity rule',
);

console.log(`PASS: safe-change checklist contract (${requiredSignals.length} safety signals checked)`);
