# RailOps — journal de travail

> Historique intégral jusqu’au passage du 2026-08-30 03:15 Europe/Paris : `docs/worklog-railops-archive-through-2026-08-30-0315.md`. Le journal courant a été consolidé ; les entrées détaillées antérieures restent dans les archives et fragments `docs/worklog-railops-append/`.

## 2026-08-30 — couverture commune des PDF RailOps 13:29 Europe/Paris

- État réel contrôlé : `security/v150b2b-rls-ready` est alignée sur l’ascendance de `main` (`behind_by: 0`) ; `main` reste à `37b216936a6692d54f82cbc004b30c936d13785a` et n’a pas été modifié.
- Inventaire runtime : le code actif prouve une famille PDF classifiable sans ambiguïté — rapports/contrôles/CTE. Les contextes PDF inventaire, étiquette ou inconnus restent volontairement en fallback legacy ; CSV/XLSX restent hors périmètre.
- Changement : ajout du garde-fou global `tests/v150b2b-pdf-coverage-contract.test.js` au commit `c06019f37bfdc21550a5e8700a532c735248076b`, après le moteur graphique commun, le routeur fail-safe et son chargement avant le bootstrap déjà présents sur la branche.
- Vérification avant consolidation : les quatre workflows du commit `c06019f37bfdc21550a5e8700a532c735248076b` sont terminés en `success` : `v150B-2B checks` run `33309472034`, `RailOps modules regression` run `33309472041`, `RailOps lifecycle regression` run `33309472070`, `Final RLS hotfix check` run `33309472040`.
- Garde-fous : aucune modification Supabase, RLS, policy, donnée, schéma, permission, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge et aucun déploiement production.
- Fallback sûr : toute action PDF non prouvée/classifiée conserve son comportement existant au lieu d’être interceptée.
