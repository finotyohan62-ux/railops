(function (root, factory) {
  const uiApi = typeof module !== 'undefined' && module.exports
    ? require('./inspection-report-ui.js')
    : root?.RailOpsInspectionReportUI;
  const routerApi = typeof module !== 'undefined' && module.exports
    ? require('./pdf-action-router.js')
    : root?.RailOpsPdfActionRouter;
  const api = factory(uiApi, routerApi);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.RailOpsInspectionReportBootstrap = api;

  if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
    const start = () => api.installExistingReportHook({
      root: document,
      getState: () => { try { return S || null; } catch (_) { return null; } },
      notify: (message, type) => { try { if (typeof toast === 'function') toast(message, type); } catch (_) {} },
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (uiApi, routerApi) {
  function isReportPdfButton(label, contextText) {
    return routerApi?.classifyPdfAction?.(label, contextText) === 'inspection-report';
  }

  function dateOnly(value) {
    if (!value) return '';
    const raw = String(value);
    const iso = raw.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (iso) return iso;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  function buildCurrentReportInput(state = {}, selectedDates = []) {
    const chantiers = Array.isArray(state.chantiers) ? state.chantiers : [];
    const chantierId = state.curC ?? state.modalData?.chantierId ?? state.modalData?.chantier_id ?? '';
    const chantier = chantiers.find(item => String(item?.id) === String(chantierId)) || {};
    const allScans = Array.isArray(state.scans) ? state.scans : [];
    const allMateriels = Array.isArray(state.mat) ? state.mat : [];
    const agents = Array.isArray(state.users) ? state.users : [];

    let scans = chantierId
      ? allScans.filter(scan => String(scan?.chantierId ?? scan?.chantier_id ?? '') === String(chantierId))
      : [];

    const dates = (Array.isArray(selectedDates) ? selectedDates : [])
      .map(dateOnly)
      .filter(Boolean)
      .sort();
    let from = dates[0] || '';
    let to = dates[dates.length - 1] || from;

    if (!from && scans.length) {
      const scanDates = scans.map(scan => dateOnly(scan?.date ?? scan?.created_at)).filter(Boolean).sort();
      from = scanDates[0] || '';
      to = scanDates[scanDates.length - 1] || from;
    }

    if (from || to) {
      scans = scans.filter(scan => {
        const day = dateOnly(scan?.date ?? scan?.created_at);
        if (!day) return true;
        if (from && day < from) return false;
        if (to && day > to) return false;
        return true;
      });
    }

    const materiels = chantierId
      ? allMateriels.filter(item => String(item?.chantierId ?? item?.chantier_id ?? '') === String(chantierId))
      : [];

    return { chantier, period: { from, to }, scans, agents, materiels };
  }

  function selectedDatesFrom(container) {
    if (!container?.querySelectorAll) return [];
    return [...container.querySelectorAll('input[type="date"]')]
      .map(input => input?.value)
      .filter(Boolean);
  }

  function bindExistingButtons({ root, getState, notify } = {}) {
    if (!root?.querySelectorAll) return 0;
    let bound = 0;
    for (const button of root.querySelectorAll('button')) {
      if (button?.dataset?.railopsReportHook === '1') continue;
      const container = button.closest?.('.msheet,.modal,[role="dialog"]') || button.parentElement;
      const actionType = routerApi?.classifyPdfAction?.(button.textContent, container?.textContent) || null;
      if (actionType !== 'inspection-report') continue;
      button.dataset.railopsReportHook = '1';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const state = typeof getState === 'function' ? getState() : null;
        if (!state) {
          notify?.('Rapport indisponible : données RailOps non chargées', 'danger');
          return;
        }
        const input = buildCurrentReportInput(state, selectedDatesFrom(container));
        const result = uiApi?.openInspectionReport?.(input) || { ok: false, reason: 'report-engine-unavailable' };
        if (!result.ok) {
          const message = result.reason === 'popup-blocked'
            ? 'Ouverture du rapport bloquée par le navigateur'
            : 'Rapport indisponible';
          notify?.(message, 'danger');
        }
      }, true);
      bound += 1;
    }
    return bound;
  }

  function installExistingReportHook({ root, getState, notify } = {}) {
    const doc = root || (typeof document !== 'undefined' ? document : null);
    if (!doc) return { ok: false, reason: 'document-unavailable' };
    const bind = () => bindExistingButtons({ root: doc, getState, notify });
    bind();
    if (typeof MutationObserver === 'undefined') return { ok: true, observer: null };
    const observer = new MutationObserver(bind);
    observer.observe(doc.body || doc.documentElement, { childList: true, subtree: true });
    return { ok: true, observer };
  }

  return { isReportPdfButton, buildCurrentReportInput, bindExistingButtons, installExistingReportHook };
});
