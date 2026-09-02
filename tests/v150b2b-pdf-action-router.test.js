const assert = require('node:assert/strict');
const {
  classifyPdfAction,
  shouldInterceptPdfAction,
} = require('../js/reports/pdf-action-router.js');

assert.equal(classifyPdfAction('Exporter PDF', 'Rapport CTE'), 'inspection-report');
assert.equal(classifyPdfAction('PDF', 'Rapport de contrôle'), 'inspection-report');
assert.equal(classifyPdfAction('Exporter PDF', 'Contrôles du chantier'), 'inspection-report');
assert.equal(classifyPdfAction('Exporter PDF', 'Étiquette matériel'), null);
assert.equal(classifyPdfAction('Exporter PDF', 'Inventaire matériel'), null);
assert.equal(classifyPdfAction('Exporter CSV', 'Rapport de contrôle'), null);
assert.equal(classifyPdfAction('Supprimer', 'Rapport CTE'), null);

assert.equal(shouldInterceptPdfAction('Exporter PDF', 'Rapport CTE'), true);
assert.equal(shouldInterceptPdfAction('Exporter PDF', 'Étiquette matériel'), false);
assert.equal(shouldInterceptPdfAction('Exporter PDF', 'Document inconnu'), false);
assert.equal(shouldInterceptPdfAction('Exporter XLSX', 'Rapport de contrôle'), false);

console.log('PASS: RailOps PDF action routing is explicit and fail-safe');
