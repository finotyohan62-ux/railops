const assert = require('node:assert/strict');
const { buildInspectionReportModel } = require('../js/reports/inspection-report.js');

const model = buildInspectionReportModel({
  chantier: { id: 'c1', nom: 'Calais - Zone X' },
  period: { from: '24/08/2026', to: '30/08/2026' },
  scans: [{
    id: 's1',
    chantierId: 'c1',
    materielId: 'MAT-037',
    agentNom: 'Martin L.',
    date: '2026-08-29T20:00:00Z',
    etatGeneral: 'degrade',
    dommages: true,
    dommagesDesc: 'Marquage endommagé',
    observations: 'À vérifier',
    actions: 'Contrôle demandé',
  }],
  materiels: [{ id: 'MAT-037', nom: 'VAT' }],
});

assert.equal(model.controls.length, 1);
assert.equal(model.controls[0].agentName, 'Martin L.');
assert.equal(model.controls[0].materialReference, 'MAT-037');
assert.equal(model.controls[0].status, 'Dégradé');
assert.equal(model.controls[0].isAnomaly, true);
assert.match(model.controls[0].comment, /Marquage endommagé/);
assert.match(model.controls[0].comment, /À vérifier/);
assert.match(model.controls[0].comment, /Contrôle demandé/);
assert.equal(model.summary.anomalies, 1);

console.log('PASS: report model supports live RailOps scan schema');
