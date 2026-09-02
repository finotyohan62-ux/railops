const assert = require('node:assert/strict');
const { renderInspectionReportHtml } = require('../js/reports/inspection-report.js');

const hostile = '<img src=x onerror="alert(1)">';
const model = {
  chantierName: hostile,
  period: { from: hostile, to: '' },
  summary: { totalControls: 1, anomalies: 1 },
  anomalies: [{
    date: '2026-08-30T06:00:00Z',
    materialReference: hostile,
    agentName: hostile,
    status: hostile,
    comment: hostile,
    isAnomaly: true,
  }],
  controls: [{
    date: '2026-08-30T06:00:00Z',
    materialReference: hostile,
    agentName: hostile,
    status: hostile,
    comment: hostile,
    isAnomaly: true,
  }],
  byAgent: [{ agentName: hostile, totalControls: 1, anomalies: 1 }],
};

const html = renderInspectionReportHtml(model);

assert.ok(!html.includes(hostile), 'report must not contain unescaped user-controlled HTML');
assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
assert.ok(!html.includes('onerror="alert(1)"'));

console.log('PASS: inspection report escapes user-controlled HTML');
