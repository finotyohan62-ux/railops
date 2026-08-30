const assert = require('node:assert/strict');
const design = require('../js/reports/pdf-design-system.js');

assert.equal(typeof design.escapeHtml, 'function');
assert.equal(typeof design.renderDocument, 'function');

const html = design.renderDocument({
  title: 'Inventaire <Nord>',
  subtitle: 'Chantier & secteur',
  context: '30/08/2026',
  summaryCards: [{ label: 'Matériels', value: 12 }],
  sections: [{ title: 'Détail', html: '<table><tbody><tr><td>Contenu métier</td></tr></tbody></table>' }],
  footer: 'RailOps export',
});

assert.match(html, /RailOps/);
assert.match(html, /@page\{size:A4/);
assert.match(html, /Inventaire &lt;Nord&gt;/);
assert.match(html, /Chantier &amp; secteur/);
assert.match(html, /Matériels/);
assert.match(html, />12</);
assert.match(html, /Contenu métier/);
assert.match(html, /RailOps export/);
assert.doesNotMatch(html, /Inventaire <Nord>/);
assert.equal(design.escapeHtml('<script>'), '&lt;script&gt;');

console.log('PASS: common RailOps PDF design contract');
