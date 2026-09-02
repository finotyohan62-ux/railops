const assert = require('node:assert/strict');
const {
  classifyPdfAction,
  shouldInterceptPdfAction,
} = require('../js/reports/pdf-action-router.js');

// Runtime inventory on 2026-08-30 proves one active PDF family that can be
// safely classified without changing permissions or business selection:
// inspection/control/CTE reports. Unknown PDF actions must remain legacy.
const provenActivePdfActions = [
  ['Exporter PDF', 'Rapport CTE', 'inspection-report'],
  ['PDF', 'Rapport de contrôle', 'inspection-report'],
  ['Exporter PDF', 'Contrôles du chantier', 'inspection-report'],
];

for (const [label, context, expectedType] of provenActivePdfActions) {
  assert.equal(classifyPdfAction(label, context), expectedType);
  assert.equal(shouldInterceptPdfAction(label, context), true);
}

// Non-PDF exports and unproven PDF contexts are explicit safe fallbacks.
assert.equal(shouldInterceptPdfAction('Exporter CSV', 'Rapport de contrôle'), false);
assert.equal(shouldInterceptPdfAction('Exporter XLSX', 'Rapport de contrôle'), false);
assert.equal(shouldInterceptPdfAction('Exporter PDF', 'Inventaire matériel'), false);
assert.equal(shouldInterceptPdfAction('Exporter PDF', 'Étiquette matériel'), false);
assert.equal(shouldInterceptPdfAction('Exporter PDF', 'Document inconnu'), false);

console.log('PASS: proven RailOps PDF coverage is explicit and unknown exports fall back safely');
