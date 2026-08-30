(function (root, factory) {
  const designApi = typeof module !== 'undefined' && module.exports
    ? require('./pdf-design-system.js')
    : root?.RailOpsPdfDesignSystem;
  const api = factory(designApi);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.RailOpsInspectionReport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (designApi) {
  function escapeHtml(value) {
    if (typeof designApi?.escapeHtml === 'function') return designApi.escapeHtml(value);
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

  function liveStatus(scan) {
    const explicit = scan?.statut ?? scan?.status;
    if (explicit !== undefined && explicit !== null && String(explicit).trim()) return String(explicit);
    const state = String(scan?.etatGeneral ?? '').trim().toLowerCase();
    return ({
      bon: 'Bon',
      acceptable: 'Acceptable',
      degrade: 'Dégradé',
      'dégradé': 'Dégradé',
      'hors-service': 'Hors service',
      inconnu: 'Inconnu',
    })[state] || (scan?.etatGeneral ? String(scan.etatGeneral) : '');
  }

  function liveComment(scan) {
    const explicit = scan?.commentaire ?? scan?.comment;
    if (explicit !== undefined && explicit !== null && String(explicit).trim()) return String(explicit);
    return [scan?.dommagesDesc, scan?.observations, scan?.actions]
      .filter(value => value !== undefined && value !== null && String(value).trim())
      .map(value => String(value).trim())
      .join(' · ');
  }

  function isAnomaly(scan) {
    const explicit = String(scan?.statut ?? scan?.status ?? '').trim().toUpperCase() === 'ANOMALIE';
    return explicit || scan?.dommages === true;
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
      const materialId = scan.materiel_id ?? scan.material_id ?? scan.materielId ?? scan.materialId ?? '';
      const liveMaterialReference = scan.materielId !== undefined && scan.materielId !== null
        ? String(scan.materielId)
        : null;
      const fallbackAgent = scan.agentNom ?? String(agentId || 'Agent');
      return {
        id: scan.id ?? '',
        date: scan.date ?? scan.created_at ?? '',
        status: liveStatus(scan),
        comment: liveComment(scan),
        agentId,
        materialId,
        agentName: scan.agentNom || agentLabel(agentById.get(String(agentId)), fallbackAgent),
        materialReference: liveMaterialReference || materialLabel(materialById.get(String(materialId)), String(materialId || 'Matériel')),
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
      <tr><td>${escapeHtml(formatDate(control.date))}</td><td>${escapeHtml(control.materialReference)}</td><td>${escapeHtml(control.agentName)}</td><td><span class="status anomaly">${escapeHtml(control.status || 'ANOMALIE')}</span></td><td>${escapeHtml(control.comment || '—')}</td></tr>`, 'Aucune anomalie sur la période.');
    const controlRows = tableRows(safeModel.controls || [], control => `
      <tr><td>${escapeHtml(formatDate(control.date))}</td><td>${escapeHtml(control.materialReference)}</td><td>${escapeHtml(control.agentName)}</td><td><span class="status ${control.isAnomaly ? 'anomaly' : 'ok'}">${escapeHtml(control.status || '—')}</span></td><td>${escapeHtml(control.comment || '—')}</td></tr>`, 'Aucun contrôle sur la période.');
    const agentItems = Array.isArray(safeModel.byAgent) ? safeModel.byAgent.filter(Boolean) : [];
    const agentRows = agentItems.length
      ? agentItems.map(item => `<tr><td>${escapeHtml(item.agentName)}</td><td class="num">${escapeHtml(item.totalControls)}</td><td class="num">${escapeHtml(item.anomalies)}</td></tr>`).join('')
      : '<tr><td colspan="3" class="empty">Aucun contrôle par agent sur la période.</td></tr>';

    if (typeof designApi?.renderDocument !== 'function') return '';
    return designApi.renderDocument({
      title: 'Rapport de contrôles',
      subtitle: safeModel.chantierName,
      context: periodLabel(safeModel.period),
      summaryTitle: 'Synthèse',
      summaryCards: [
        { label: 'Contrôles', value: safeModel.summary?.totalControls ?? 0 },
        { label: 'Anomalies', value: safeModel.summary?.anomalies ?? 0 },
        { label: 'Période', value: periodLabel(safeModel.period), compact: true },
      ],
      sections: [
        {
          title: 'Anomalies prioritaires',
          html: `<table><thead><tr><th>Date</th><th>Matériel</th><th>Agent</th><th>Statut</th><th>Commentaire</th></tr></thead><tbody>${anomalyRows}</tbody></table>`,
        },
        {
          title: 'Détail des contrôles',
          html: `<table><thead><tr><th>Date</th><th>Matériel</th><th>Agent</th><th>Statut</th><th>Commentaire</th></tr></thead><tbody>${controlRows}</tbody></table>`,
        },
        {
          title: 'Suivi par agent',
          html: `<table><thead><tr><th>Agent</th><th class="num">Contrôles</th><th class="num">Anomalies</th></tr></thead><tbody>${agentRows}</tbody></table>`,
        },
      ],
      footer: 'Rapport généré depuis les données RailOps fournies à l’export. Aucun indicateur n’est extrapolé.',
    });
  }

  return { buildInspectionReportModel, renderInspectionReportHtml };
});
