const assert = require('node:assert/strict');
const { buildInspectionReportModel, renderInspectionReportHtml } = require('../js/reports/inspection-report.js');

const model = buildInspectionReportModel({
  chantier: { id: 'chantier-missing-lookups', nom: 'Chantier Test' },
  scans: [{
    id: 'scan-missing-lookups',
    agent_id: 'agent-inconnu-42',
    materiel_id: 'materiel-inconnu-17',
    statut: 'OK',
    commentaire: 'Références non chargées localement',
  }],
  agents: [],
  materiels: [],
});

assert.equal(model.summary.totalControls, 1);
assert.equal(model.controls[0].agentName, 'agent-inconnu-42');
assert.equal(model.controls[0].materialReference, 'materiel-inconnu-17');

const html = renderInspectionReportHtml(model);
assert.ok(html.includes('agent-inconnu-42'));
assert.ok(html.includes('materiel-inconnu-17'));

console.log('PASS: inspection report preserves missing lookup identifiers');
