const assert = require('node:assert/strict');
const { openInspectionReport } = require('../js/reports/inspection-report-ui.js');

let written = '';
let printed = false;
let focused = false;
const fakeWindow = {
  document: {
    open() {},
    write(value) { written += value; },
    close() {},
  },
  focus() { focused = true; },
  print() { printed = true; },
};

const result = openInspectionReport({
  chantier: { nom: 'Chantier Pont' },
  period: { from: '2026-08-24', to: '2026-08-30' },
  scans: [{
    id: 'scan-live',
    materielId: 'VAT-22',
    agentNom: 'Agent Terrain',
    date: '2026-08-30T06:00:00Z',
    etatGeneral: 'bon',
    dommages: false,
    observations: 'RAS',
  }],
  materiels: [{ id: 'VAT-22', nom: 'VAT' }],
  openWindow: () => fakeWindow,
});

assert.equal(result.ok, true);
assert.ok(written.includes('Rapport de contrôles'));
assert.ok(written.includes('Chantier Pont'));
assert.ok(written.includes('VAT-22'));
assert.ok(focused, 'report window should receive focus');
assert.ok(printed, 'report window should open the print/PDF dialog');

const blocked = openInspectionReport({ openWindow: () => null });
assert.equal(blocked.ok, false);
assert.equal(blocked.reason, 'popup-blocked');

console.log('PASS: inspection report browser bridge');
