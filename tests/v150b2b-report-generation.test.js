const assert = require('node:assert/strict');
const { buildInspectionReportModel, renderInspectionReportHtml } = require('../js/reports/inspection-report.js');

const scans = [
  {
    id: 'scan-1',
    chantier_id: 'chantier-1',
    agent_id: 'agent-1',
    materiel_id: 'mat-1',
    date: '2026-08-29T20:10:00.000Z',
    statut: 'OK',
    commentaire: 'RAS',
  },
  {
    id: 'scan-2',
    chantier_id: 'chantier-1',
    agent_id: 'agent-2',
    materiel_id: 'mat-2',
    date: '2026-08-29T21:15:00.000Z',
    statut: 'ANOMALIE',
    commentaire: 'Protection abîmée',
  },
];

const model = buildInspectionReportModel({
  chantier: { id: 'chantier-1', nom: 'Chantier Test' },
  period: { from: '2026-08-29', to: '2026-08-30' },
  scans,
  agents: [
    { id: 'agent-1', nom: 'Martin', prenom: 'Alice' },
    { id: 'agent-2', nom: 'Durand', prenom: 'Bob' },
  ],
  materiels: [
    { id: 'mat-1', reference: 'MAT-001' },
    { id: 'mat-2', reference: 'MAT-002' },
  ],
});

assert.equal(model.chantierName, 'Chantier Test');
assert.deepEqual(model.period, { from: '2026-08-29', to: '2026-08-30' });
assert.equal(model.summary.totalControls, 2);
assert.equal(model.summary.anomalies, 1);
assert.equal(model.controls.length, 2);
assert.equal(model.anomalies.length, 1);
assert.equal(model.byAgent.length, 2);
assert.equal(model.anomalies[0].materialReference, 'MAT-002');

const html = renderInspectionReportHtml(model);
for (const expected of [
  'Rapport de contrôles',
  'Chantier Test',
  'Synthèse',
  'Anomalies prioritaires',
  'Détail des contrôles',
  'Suivi par agent',
  'MAT-002',
  'Protection abîmée',
]) {
  assert.ok(html.includes(expected), `Le rapport doit contenir : ${expected}`);
}

const escaped = renderInspectionReportHtml(buildInspectionReportModel({
  chantier: { id: 'chantier-x', nom: '<script>alert("chantier")</script>' },
  period: { from: '2026-08-29', to: '2026-08-29' },
  scans: [{
    id: 'scan-x',
    agent_id: 'agent-x',
    materiel_id: 'mat-x',
    statut: 'ANOMALIE',
    commentaire: '<img src=x onerror="alert(1)">',
  }],
  agents: [{ id: 'agent-x', prenom: '<b>Alice</b>', nom: 'Martin' }],
  materiels: [{ id: 'mat-x', reference: '<svg onload="alert(2)">' }],
}));
for (const unsafe of [
  '<script>alert("chantier")</script>',
  '<img src=x onerror="alert(1)">',
  '<b>Alice</b>',
  '<svg onload="alert(2)">',
]) {
  assert.ok(!escaped.includes(unsafe), `Le HTML du rapport doit échapper : ${unsafe}`);
}
for (const safe of [
  '&lt;script&gt;alert(&quot;chantier&quot;)&lt;/script&gt;',
  '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
  '&lt;b&gt;Alice&lt;/b&gt; Martin',
  '&lt;svg onload=&quot;alert(2)&quot;&gt;',
]) {
  assert.ok(escaped.includes(safe), `Le HTML du rapport doit conserver la valeur échappée : ${safe}`);
}

const nullSafeModel = buildInspectionReportModel({
  chantier: null,
  period: null,
  scans: null,
  agents: null,
  materiels: null,
});
assert.equal(nullSafeModel.chantierName, 'Chantier');
assert.deepEqual(nullSafeModel.period, { from: '', to: '' });
assert.equal(nullSafeModel.summary.totalControls, 0);
assert.equal(nullSafeModel.summary.anomalies, 0);
assert.deepEqual(nullSafeModel.controls, []);
assert.deepEqual(nullSafeModel.byAgent, []);
assert.ok(renderInspectionReportHtml(nullSafeModel).includes('Aucun contrôle sur la période.'));

const sparseLookupModel = buildInspectionReportModel({
  scans: [{ id: 'scan-sparse', agent_id: 'agent-1', materiel_id: 'mat-1', statut: 'OK' }],
  agents: [null, { id: 'agent-1', nom: 'Martin', prenom: 'Alice' }],
  materiels: [undefined, { id: 'mat-1', reference: 'MAT-001' }],
});
assert.equal(sparseLookupModel.summary.totalControls, 1);
assert.equal(sparseLookupModel.controls[0].agentName, 'Alice Martin');
assert.equal(sparseLookupModel.controls[0].materialReference, 'MAT-001');

const sparseScansModel = buildInspectionReportModel({
  scans: [
    null,
    { id: 'scan-valid', agent_id: 'agent-1', materiel_id: 'mat-1', statut: 'OK' },
    undefined,
  ],
  agents: [{ id: 'agent-1', nom: 'Martin', prenom: 'Alice' }],
  materiels: [{ id: 'mat-1', reference: 'MAT-001' }],
});
assert.equal(sparseScansModel.summary.totalControls, 1);
assert.equal(sparseScansModel.controls[0].id, 'scan-valid');

const sparseRenderedModel = {
  chantierName: 'Chantier Test',
  period: { from: '2026-08-29', to: '2026-08-29' },
  summary: { totalControls: 1, anomalies: 1 },
  anomalies: [
    null,
    { date: '', materialReference: 'MAT-001', agentName: 'Alice Martin', status: 'ANOMALIE', comment: 'À revoir', isAnomaly: true },
  ],
  controls: [
    undefined,
    { date: '', materialReference: 'MAT-001', agentName: 'Alice Martin', status: 'ANOMALIE', comment: 'À revoir', isAnomaly: true },
  ],
  byAgent: [
    null,
    { agentName: 'Alice Martin', totalControls: 1, anomalies: 1 },
  ],
};
assert.doesNotThrow(() => renderInspectionReportHtml(sparseRenderedModel));
const sparseRenderedHtml = renderInspectionReportHtml(sparseRenderedModel);
assert.ok(sparseRenderedHtml.includes('MAT-001'));
assert.ok(sparseRenderedHtml.includes('Alice Martin'));

const compatibilityAliasModel = buildInspectionReportModel({
  chantier: { name: 'Chantier Alias' },
  period: { from: '2026-08-30', to: '2026-08-30' },
  scans: [{
    id: 'scan-alias',
    agentId: 'agent-alias',
    material_id: 'mat-alias',
    created_at: '2026-08-30T04:00:00.000Z',
    status: 'ANOMALIE',
    comment: 'Alias conservés',
  }],
  agents: [{ id: 'agent-alias', name: 'Agent Alias' }],
  materiels: [{ id: 'mat-alias', nom: 'Matériel Alias' }],
});
assert.equal(compatibilityAliasModel.chantierName, 'Chantier Alias');
assert.equal(compatibilityAliasModel.summary.totalControls, 1);
assert.equal(compatibilityAliasModel.summary.anomalies, 1);
assert.equal(compatibilityAliasModel.controls[0].agentName, 'Agent Alias');
assert.equal(compatibilityAliasModel.controls[0].materialReference, 'Matériel Alias');
assert.equal(compatibilityAliasModel.controls[0].status, 'ANOMALIE');
assert.equal(compatibilityAliasModel.controls[0].comment, 'Alias conservés');
assert.equal(compatibilityAliasModel.controls[0].date, '2026-08-30T04:00:00.000Z');

console.log('PASS: inspection report model and renderer contract');
