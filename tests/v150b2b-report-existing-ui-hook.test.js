const assert = require('node:assert/strict');
const { isReportPdfButton, buildCurrentReportInput } = require('../js/reports/inspection-report-bootstrap.js');

assert.equal(isReportPdfButton('Exporter PDF', 'Rapport CTE'), true);
assert.equal(isReportPdfButton('PDF', 'Rapport de contrôle'), true);
assert.equal(isReportPdfButton('Exporter PDF', 'Étiquette matériel'), false);
assert.equal(isReportPdfButton('Supprimer', 'Rapport CTE'), false);

const state = {
  curC: 'c-1',
  chantiers: [{ id: 'c-1', nom: 'Chantier Test' }],
  scans: [
    { id: 's1', chantierId: 'c-1', materielId: 'M-1', agentNom: 'Agent A', date: '2026-08-28T08:00:00Z', etatGeneral: 'bon', dommages: false },
    { id: 's2', chantierId: 'c-1', materielId: 'M-2', agentNom: 'Agent B', date: '2026-08-30T08:00:00Z', etatGeneral: 'bon', dommages: false },
    { id: 'other', chantierId: 'c-2', materielId: 'M-3', agentNom: 'Agent C', date: '2026-08-30T08:00:00Z', etatGeneral: 'bon', dommages: false },
  ],
  mat: [
    { id: 'M-1', chantierId: 'c-1', nom: 'VAT 1' },
    { id: 'M-2', chantierId: 'c-1', nom: 'VAT 2' },
    { id: 'M-3', chantierId: 'c-2', nom: 'VAT 3' },
  ],
  users: [{ id: 'u1', nom: 'Agent A' }],
};

const input = buildCurrentReportInput(state, ['2026-08-29', '2026-08-30']);
assert.equal(input.chantier.nom, 'Chantier Test');
assert.equal(input.period.from, '2026-08-29');
assert.equal(input.period.to, '2026-08-30');
assert.deepEqual(input.scans.map(s => s.id), ['s2']);
assert.deepEqual(input.materiels.map(m => m.id), ['M-1', 'M-2']);
assert.equal(input.agents.length, 1);

const noActiveChantier = buildCurrentReportInput({ ...state, curC: null, modalData: null }, []);
assert.deepEqual(noActiveChantier.chantier, {});
assert.deepEqual(noActiveChantier.scans, []);
assert.deepEqual(noActiveChantier.materiels, []);
assert.deepEqual(noActiveChantier.period, { from: '', to: '' });
assert.equal(noActiveChantier.agents.length, 1);

console.log('PASS: existing report PDF hook preserves current UI scope');
