(function (root, factory) {
  const reportApi = typeof module !== 'undefined' && module.exports
    ? require('./inspection-report.js')
    : root?.RailOpsInspectionReport;
  const api = factory(reportApi);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.RailOpsInspectionReportUI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (reportApi) {
  function openInspectionReport({
    chantier = {},
    period = {},
    scans = [],
    agents = [],
    materiels = [],
    openWindow = null,
  } = {}) {
    if (!reportApi?.buildInspectionReportModel || !reportApi?.renderInspectionReportHtml) {
      return { ok: false, reason: 'report-engine-unavailable' };
    }

    const open = openWindow || (() => {
      if (typeof window === 'undefined' || typeof window.open !== 'function') return null;
      return window.open('', '_blank', 'noopener,noreferrer');
    });
    const target = open();
    if (!target) return { ok: false, reason: 'popup-blocked' };

    const model = reportApi.buildInspectionReportModel({ chantier, period, scans, agents, materiels });
    const html = reportApi.renderInspectionReportHtml(model);
    target.document.open();
    target.document.write(html);
    target.document.close();
    if (typeof target.focus === 'function') target.focus();
    if (typeof target.print === 'function') target.print();
    return { ok: true, model, html };
  }

  return { openInspectionReport };
});
