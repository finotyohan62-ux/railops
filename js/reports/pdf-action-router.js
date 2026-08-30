(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.RailOpsPdfActionRouter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PDF_ACTIONS = [
    {
      type: 'inspection-report',
      matches(label, contextText) {
        return /pdf/i.test(String(label || '')) && /rapport|contr[oô]le|cte/i.test(String(contextText || ''));
      },
    },
  ];

  function classifyPdfAction(label, contextText) {
    const buttonText = String(label || '').trim();
    if (!/pdf/i.test(buttonText)) return null;
    const match = PDF_ACTIONS.find(action => action.matches(buttonText, contextText));
    return match?.type || null;
  }

  function shouldInterceptPdfAction(label, contextText) {
    return classifyPdfAction(label, contextText) !== null;
  }

  return { classifyPdfAction, shouldInterceptPdfAction };
});
