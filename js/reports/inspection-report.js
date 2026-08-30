(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.RailOpsInspectionReport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function agentLabel(agent, fallback) {
    if (!agent) return fallback || 'Agent';
    const label = [agent.prenom, agent.nom].filter(Boolean).join(' ').trim();
    return label || agent.name || fallback || 'Agent';
  }

  function materialLabel(material, fallback) {
    return material?.reference || material?.nom || material?.name || fallback || 'Matériel';
  }

  function isAnomaly(scan) {
    return String(scan?.statut ?? scan?.status ?? '').trim().toUpperCase() === 'ANOMALIE';
  }

  function buildInspectionReportModel({ chantier = {}, period = {}, scans = [], agents = [], materiels = [] } = {}) {
    chantier = chantier || {};
    period = period || {};
    scans = Array.isArray(scans) ? scans : [];
    agents = Array.isArray(agents) ? agents : [];
    materiels = Array.isArray(materiels) ? materiels : [];

    const agentById = new Map(agents.filter(Boolean).map(agent => [String(agent.id), agent]));
    const materialById = new Map(materiels.filter(Boolean).map(material => [String(material.id), material]));

    const controls = scans.filter(Boolean).map(scan => {
      const agentId = scan.agent_id ?? scan.agentId ?? '';
      const materialId = scan.materiel_id ?? scan.material_id ?? scan.materialId ?? '';
      return {
        id: scan.id ?? '',
        date: scan.date ?? scan.created_at ?? '',
        status: scan.statut ?? scan.status ?? '',
        comment: scan.commentaire ?? scan.comment ?? '',
        agentId,
        materialId,
        agentName: agentLabel(agentById.get(String(agentId)), String(agentId || 'Agent')),
        materialReference: materialLabel(materialById.get(String(materialId)), String(materialId || 'Matériel')),
        isAnomaly: isAnomaly(scan),
      };
    });

    const anomalies = controls
      .filter(control => control.isAnomaly)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const grouped = new Map();
    for (const control of controls) {
      const key = String(control.agentId || control.agentName);
      if (!grouped.has(key)) {
        grouped.set(key, {
          agentId: control.agentId,
          agentName: control.agentName,
          totalControls: 0,
          anomalies: 0,
        });
      }
      const item = grouped.get(key);
      item.totalControls += 1;
      if (control.isAnomaly) item.anomalies += 1;
    }

    return {
      chantierName: chantier.nom || chantier.name || 'Chantier',
      period: { from: period.from || '', to: period.to || '' },
      summary: { totalControls: controls.length, anomalies: anomalies.length },
      controls,
      anomalies,
      byAgent: [...grouped.values()].sort((a, b) => a.agentName.localeCompare(b.agentName, 'fr')),
    };
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date);
  }

  function periodLabel(period) {
    const from = period?.from || '';
    const to = period?.to || '';
    if (!from && !to) return 'Période non précisée';
    if (from === to || !to) return from || to;
    return `${from} → ${to}`;
  }

  function tableRows(items, rowRenderer, emptyText) {
    const rows = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!rows.length) return `<tr><td colspan="5" class="empty">${escapeHtml(emptyText)}</td></tr>`;
    return rows.map(rowRenderer).join('');
  }

  function renderInspectionReportHtml(model) {
    const safeModel = model || buildInspectionReportModel();
    const anomalyRows = tableRows(safeModel.anomalies || [], control => `
      <tr>
        <td>${escapeHtml(formatDate(control.date))}</td>
        <td>${escapeHtml(control.materialReference)}</td>
        <td>${escapeHtml(control.agentName)}</td>
        <td><span class="status anomaly">${escapeHtml(control.status || 'ANOMALIE')}</span></td>
        <td>${escapeHtml(control.comment || '—')}</td>
      </tr>`, 'Aucune anomalie sur la période.');

    const controlRows = tableRows(safeModel.controls || [], control => `
      <tr>
        <td>${escapeHtml(formatDate(control.date))}</td>
        <td>${escapeHtml(control.materialReference)}</td>
        <td>${escapeHtml(control.agentName)}</td>
        <td><span class="status ${control.isAnomaly ? 'anomaly' : 'ok'}">${escapeHtml(control.status || '—')}</span></td>
        <td>${escapeHtml(control.comment || '—')}</td>
      </tr>`, 'Aucun contrôle sur la période.');

    const agentItems = Array.isArray(safeModel.byAgent) ? safeModel.byAgent.filter(Boolean) : [];
    const agentRows = agentItems.length
      ? agentItems.map(item => `
        <tr>
          <td>${escapeHtml(item.agentName)}</td>
          <td class="num">${escapeHtml(item.totalControls)}</td>
          <td class="num">${escapeHtml(item.anomalies)}</td>
        </tr>`).join('')
      : '<tr><td colspan="3" class="empty">Aucun contrôle par agent sur la période.</td></tr>';

    return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Rapport de contrôles — ${escapeHtml(safeModel.chantierName)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #172033; background: #fff; font-size: 11px; line-height: 1.4; }
  .report { max-width: 182mm; margin: 0 auto; }
  header { border-bottom: 2px solid #172033; padding: 0 0 12px; margin-bottom: 16px; display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; }
  h1 { font-size: 23px; margin: 0; letter-spacing: -.35px; }
  .brand { font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  .meta { margin-top: 4px; color: #596579; }
  section { margin: 0 0 18px; break-inside: avoid; }
  h2 { font-size: 14px; margin: 0 0 8px; padding-bottom: 5px; border-bottom: 1px solid #dce1e8; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .card { border: 1px solid #dce1e8; border-radius: 8px; padding: 11px; min-height: 58px; }
  .card .label { color: #687386; font-size: 9px; text-transform: uppercase; letter-spacing: .06em; }
  .card .value { font-size: 21px; font-weight: 800; margin-top: 2px; }
  .card .text { font-size: 12px; font-weight: 700; margin-top: 5px; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  th { text-align: left; background: #f3f5f8; color: #49556a; font-size: 8.5px; text-transform: uppercase; letter-spacing: .03em; padding: 7px 6px; border-bottom: 1px solid #ccd3dd; }
  td { padding: 7px 6px; border-bottom: 1px solid #e5e9ef; vertical-align: top; }
  tr { break-inside: avoid; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .status { display: inline-block; padding: 2px 6px; border-radius: 999px; font-size: 8.5px; font-weight: 700; white-space: nowrap; background: #edf1f5; }
  .status.anomaly { background: #f8e9e9; color: #8a2929; }
  .status.ok { background: #e9f4ed; color: #28603b; }
  .empty { color: #7a8495; text-align: center; padding: 14px; }
  footer { color: #778294; font-size: 8.5px; border-top: 1px solid #e0e4ea; padding-top: 7px; margin-top: 20px; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<main class="report">
  <header>
    <div>
      <div class="brand">RailOps</div>
      <h1>Rapport de contrôles</h1>
      <div class="meta">${escapeHtml(safeModel.chantierName)} · ${escapeHtml(periodLabel(safeModel.period))}</div>
    </div>
  </header>

  <section>
    <h2>Synthèse</h2>
    <div class="summary">
      <div class="card"><div class="label">Contrôles</div><div class="value">${escapeHtml(safeModel.summary?.totalControls ?? 0)}</div></div>
      <div class="card"><div class="label">Anomalies</div><div class="value">${escapeHtml(safeModel.summary?.anomalies ?? 0)}</div></div>
      <div class="card"><div class="label">Période</div><div class="text">${escapeHtml(periodLabel(safeModel.period))}</div></div>
    </div>
  </section>

  <section>
    <h2>Anomalies prioritaires</h2>
    <table><thead><tr><th>Date</th><th>Matériel</th><th>Agent</th><th>Statut</th><th>Commentaire</th></tr></thead><tbody>${anomalyRows}</tbody></table>
  </section>

  <section>
    <h2>Détail des contrôles</h2>
    <table><thead><tr><th>Date</th><th>Matériel</th><th>Agent</th><th>Statut</th><th>Commentaire</th></tr></thead><tbody>${controlRows}</tbody></table>
  </section>

  <section>
    <h2>Suivi par agent</h2>
    <table><thead><tr><th>Agent</th><th class="num">Contrôles</th><th class="num">Anomalies</th></tr></thead><tbody>${agentRows}</tbody></table>
  </section>

  <footer>Rapport généré depuis les données RailOps fournies à l’export. Aucun indicateur n’est extrapolé.</footer>
</main>
</body>
</html>`;
  }

  return { buildInspectionReportModel, renderInspectionReportHtml };
});
