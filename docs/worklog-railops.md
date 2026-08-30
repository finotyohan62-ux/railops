# RailOps — journal de travail

> Historique intégral jusqu’au passage du 2026-08-30 03:15 Europe/Paris : `docs/worklog-railops-archive-through-2026-08-30-0315.md`. Le journal courant a été consolidé ; les entrées détaillées antérieures restent dans les archives et fragments `docs/worklog-railops-append/`.

## 2026-08-30 — couverture commune des PDF RailOps 13:29 Europe/Paris

- État réel contrôlé : `security/v150b2b-rls-ready` est alignée sur l’ascendance de `main` (`behind_by: 0`) ; `main` reste à `37b216936a6692d54f82cbc004b30c936d13785a` et n’a pas été modifié.
- Inventaire runtime : le code actif prouve une famille PDF classifiable sans ambiguïté — rapports/contrôles/CTE. Les contextes PDF inventaire, étiquette ou inconnus restent volontairement en fallback legacy ; CSV/XLSX restent hors périmètre.
- Changement : ajout du garde-fou global `tests/v150b2b-pdf-coverage-contract.test.js` au commit `c06019f37bfdc21550a5e8700a532c735248076b`, après le moteur graphique commun, le routeur fail-safe et son chargement avant le bootstrap déjà présents sur la branche.
- Vérification avant consolidation : les quatre workflows du commit `c06019f37bfdc21550a5e8700a532c735248076b` sont terminés en `success` : `v150B-2B checks` run `33309472034`, `RailOps modules regression` run `33309472041`, `RailOps lifecycle regression` run `33309472070`, `Final RLS hotfix check` run `33309472040`.
- Garde-fous : aucune modification Supabase, RLS, policy, donnée, schéma, permission, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge et aucun déploiement production.
- Fallback sûr : toute action PDF non prouvée/classifiée conserve son comportement existant au lieu d’être interceptée.

## 2026-08-30 — mise en production du rapport PDF RailOps 13:56 Europe/Paris

- Déploiement explicitement demandé : le lot runtime PDF validé a été porté sur `main` sans fusionner la PR sécurité ni importer ses autres changements.
- `main` est passé de `37b216936a6692d54f82cbc004b30c936d13785a` à `fd590aff348f52aade83f51e838f96457a14402c` (`feat: deploy RailOps PDF report redesign`). Le diff final par rapport à l’ancien `main` contient uniquement `js/core/sync.js` (+24 lignes de chargement) et les cinq modules `js/reports/*` du système de rapport PDF.
- Incident technique corrigé dans la même opération : un commit intermédiaire `34dcf2a2f69ccc03a9d3667b91358f944f8b0ae4` avait ajouté un `README.md` vide par erreur ; le commit final le supprime. Le diff final confirmé ne contient aucun changement `README.md`.
- Vérification production : statut GitHub `Vercel` = `success` sur `fd590aff348f52aade83f51e838f96457a14402c`; workflow `RailOps lifecycle regression` run `33310160560` = `success`.
- Réalignement de la branche sécurité effectué au merge commit `bc3a206d11d2f56571a7bfbd81fb7fb35d4a71db`, sans changement de son arbre applicatif.
- Garde-fous respectés : aucune modification Supabase, RLS, policy, donnée, schéma, permission, règle métier, Import, Multi-chantier ou purge hebdomadaire ; PR #1 non fusionnée et RLS stricte non activée.

## 2026-08-30 — snapshot maintenance lecture seule 14:17 Europe/Paris

- État réel vérifié avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c`, branche `security/v150b2b-rls-ready` au head initial `d139ab9620ee0b89ae90b1bbea8b05b6b4a9c6c6`, comparaison GitHub à 697 commits d’avance / 0 de retard ; `main` laissé intact.
- Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`. Les familles d’avis restent stables : 5 `RLS Enabled No Policy`, plusieurs RPC `SECURITY DEFINER` exécutables par `authenticated`, protection des mots de passe compromis désactivée, et 2 index `inspections_*` signalés inutilisés.
- Changement basse risque : ajout du relevé documentaire `docs/supabase-state/2026-08-30-1417-maintenance.md` au commit `8ee25025f6d7609a72d6af5880151cfacec07b58`. Aucune écriture Supabase ni modification runtime, schéma, RLS, policy, permission, donnée ou règle métier.
- Vérification : `v150B-2B checks` run `33311152255`, `RailOps modules regression` run `33311152264`, `RailOps lifecycle regression` run `33311152247` et `Final RLS hotfix check` run `33311152245` sont tous terminés en `success`.
- Point en attente : aucune action automatique sur les avertissements de sécurité/Auth ni sur les index inutilisés ; ces sujets restent soumis à validation explicite avant tout changement de permissions, Auth ou schéma.

## 2026-08-30 — snapshot maintenance lecture seule 15:13 Europe/Paris

- État réel contrôlé avant changement : `main` à `fd590aff348f52aade83f51e838f96457a14402c`, branche initialement à `51e922472a4b51bd235f4d4eb4ec935829949026`, PR #1 ouverte/draft/non fusionnée et divergence initiale à 699 commits d’avance / 0 de retard. `main` est resté intact.
- Supabase `railops` confirmé `ACTIVE_HEALTHY` sous PostgreSQL `17.6.1.084`. Lecture fraîche des policies cœur : `agents=0`, `chantiers=4`, `deleted_ids=1`, `inspections=0`, `materiels=4`, `prix_catalogue=1`, `scans=4`, `users=2`, RLS activée sur les huit tables. Les Advisors restent à 5 avis `RLS Enabled No Policy`, 33 avertissements `SECURITY DEFINER` exécutables par `authenticated`, protection des mots de passe compromis désactivée et 2 index `inspections_*` signalés inutilisés.
- Changement basse risque : création puis mise en conformité du snapshot `docs/supabase-state/2026-08-30-1513.md` (`a2bc8f9ed37f6057c9defbbab5e18b8c94f2e511`, `40fa26144604ff961bfc2736022af4e67461128d`, correction finale `0d62a5b1e35e75b411ed828e8b31265daf03ee40`). Les deux échecs intermédiaires ont été diagnostiqués comme des écarts de format documentaire au contrat de snapshot, sans impact runtime.
- Vérification finale du snapshot : `v150B-2B checks` run `33313782154`, `Final RLS hotfix check` run `33313782148`, `RailOps modules regression` run `33313782145` et `RailOps lifecycle regression` run `33313782144` sont tous terminés en `success` sur `0d62a5b1e35e75b411ed828e8b31265daf03ee40`.
- Garde-fous respectés : aucune écriture Supabase, aucune modification de données, schéma, RLS, policy, permission, Auth, règle métier, Import, Multi-chantier ou purge hebdomadaire ; aucun merge, aucune RLS stricte et aucun déploiement production.
- Point en attente : les avertissements sécurité/Auth et les index inutilisés restent volontairement sans action automatique car toute remédiation toucherait aux permissions, à l'Auth ou au schéma et exige une validation explicite.
