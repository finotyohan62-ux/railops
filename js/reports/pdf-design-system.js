(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.RailOpsPdfDesignSystem = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderSummaryCards(cards, title = 'Synthèse') {
    const items = Array.isArray(cards) ? cards.filter(Boolean) : [];
    if (!items.length) return '';
    return `<section>${title ? `<h2>${escapeHtml(title)}</h2>` : ''}<div class="summary">${items.map(card => {
      const valueClass = card.compact ? 'text' : 'value';
      return `<div class="card"><div class="label">${escapeHtml(card.label)}</div><div class="${valueClass}">${escapeHtml(card.value)}</div></div>`;
    }).join('')}</div></section>`;
  }

  function renderSections(sections) {
    return (Array.isArray(sections) ? sections.filter(Boolean) : [])
      .map(section => `<section><h2>${escapeHtml(section.title)}</h2>${section.html || ''}</section>`)
      .join('');
  }

  function renderDocument({ title = 'Document', subtitle = '', context = '', summaryCards = [], summaryTitle = 'Synthèse', sections = [], footer = '' } = {}) {
    return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} — RailOps</title>
<style>
@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#fff;font-size:11px;line-height:1.4}.report{max-width:182mm;margin:0 auto}header{border-bottom:2px solid #172033;padding:0 0 12px;margin-bottom:16px;display:flex;justify-content:space-between;gap:16px;align-items:flex-end}h1{font-size:23px;margin:0;letter-spacing:-.35px}.brand{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.meta{margin-top:4px;color:#596579}section{margin:0 0 18px;break-inside:avoid}h2{font-size:14px;margin:0 0 8px;padding-bottom:5px;border-bottom:1px solid #dce1e8}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.card{border:1px solid #dce1e8;border-radius:8px;padding:11px;min-height:58px}.card .label{color:#687386;font-size:9px;text-transform:uppercase;letter-spacing:.06em}.card .value{font-size:21px;font-weight:800;margin-top:2px}.card .text{font-size:12px;font-weight:700;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:9.5px}th{text-align:left;background:#f3f5f8;color:#49556a;font-size:8.5px;text-transform:uppercase;letter-spacing:.03em;padding:7px 6px;border-bottom:1px solid #ccd3dd}td{padding:7px 6px;border-bottom:1px solid #e5e9ef;vertical-align:top}tr{break-inside:avoid}.num{text-align:right;font-variant-numeric:tabular-nums}.status{display:inline-block;padding:2px 6px;border-radius:999px;font-size:8.5px;font-weight:700;white-space:nowrap;background:#edf1f5}.status.anomaly{background:#f8e9e9;color:#8a2929}.status.ok{background:#e9f4ed;color:#28603b}.empty{color:#7a8495;text-align:center;padding:14px}footer{color:#778294;font-size:8.5px;border-top:1px solid #e0e4ea;padding-top:7px;margin-top:20px}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body><main class="report"><header><div><div class="brand">RailOps</div><h1>${escapeHtml(title)}</h1>${subtitle ? `<div class="meta">${escapeHtml(subtitle)}</div>` : ''}${context ? `<div class="meta">${escapeHtml(context)}</div>` : ''}</div></header>${renderSummaryCards(summaryCards, summaryTitle)}${renderSections(sections)}<footer>${escapeHtml(footer)}</footer></main></body></html>`;
  }

  return { escapeHtml, renderDocument };
});
