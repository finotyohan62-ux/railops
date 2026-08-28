# RailOps — journal de travail

> Historique intégral du journal jusqu’au passage du 2026-08-28 22:15 Europe/Paris : `docs/worklog-railops-archive-through-2026-08-28-2215.md`. Le journal courant continue ci-dessous.

## 2026-08-28 — diagnostics explicites du manifeste CI critique 23:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `4846a5cdfdf1c5cede76f051308722ad4f9c48e6`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence `2 commits behind / 550 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`; RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`. Aucune écriture Supabase effectuée.
- Amélioration réversible et sans runtime : `tests/v150b2b-runner-coverage.test.js` exige désormais des diagnostics directs si le manifeste de gardes CI critiques est vide ou contient des doublons ; `tests/run-v150b2b-checks.js` arrête immédiatement la vérification avec un message explicite dans ces deux cas.
- Cycle rouge/vert vérifié : commit test `7cfc9dc939373c5ea9d23d14cc15274f75cf4a31` a fait échouer `v150B-2B checks` run `33211667565`; commit fonctionnel `debaa6fd622080219ac81f691e0896e78839cd0b` (`ci: diagnose invalid critical test manifest`) a remis l’étape `Run v150B-2B verification suite` au vert dans le run `33211720507`.
- Garde-fous respectés : aucun code applicatif runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; les deux commits `main` absents de la branche touchent `js/core/sync.js` et ses tests, donc leur intégration reste volontairement hors scope sans validation explicite.

## 2026-08-29 — baseline Supabase Advisor 00:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `a7b00c9c931527786e2447eb698dc64b0acb4562`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Contrôle Supabase strictement en lecture seule : projet `railops` (`tbmzmmamaiftbbbuelgd`) `ACTIVE_HEALTHY`; Advisor sécurité relu. Les alertes présentes concernent notamment des tables avec RLS sans policy, des fonctions `SECURITY DEFINER` exécutables par `authenticated` et la protection contre les mots de passe compromis désactivée. Aucune écriture Supabase effectuée.
- Amélioration réversible et sans runtime : ajout de `docs/supabase-advisor-baseline.md` pour figer le diagnostic courant et expliciter que ces alertes ne doivent pas être corrigées automatiquement, car elles impliquent potentiellement permissions, RLS, authentification ou migrations.
- Premier contrôle CI : `v150B-2B checks` run `33216170698` a échoué uniquement sur `tests/v150b2b-worklog-contract.test.js`. Cause racine confirmée : le test exigeait que le dernier fragment historique soit encore présent dans `docs/worklog-railops.md`, alors que cette entrée avait été correctement déplacée dans `docs/worklog-railops-archive-through-2026-08-28-2215.md` lors de la rotation du journal.
- Correctif test uniquement : `tests/v150b2b-worklog-contract.test.js` vérifie désormais la présence du dernier fragment dans l’historique durable constitué du journal courant et de ses archives, sans modifier le runtime ni les règles métier. Commit `399ec741a4ff3ba46d68731dc03ad2818ec3bdf2` (`test: accept archived worklog append history`).
- Vérification : `v150B-2B checks` run `33216258220` terminé en `success` sur `399ec741a4ff3ba46d68731dc03ad2818ec3bdf2`; le document Advisor est lisible depuis la branche et reprend uniquement l’état observé via Supabase Advisor.
- Commit documentaire initial : `68d56fcd74be1595edd7146458eb9da81fa34684` (`docs: capture Supabase advisor baseline`).
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, policy, grant, RLS stricte, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production ; `main` est resté intact.
- Point en attente : les alertes Advisor impliquant permissions/RLS/authentification restent volontairement non traitées jusqu’à validation explicite ; aucun test utilisateur requis pour cette passe documentaire.

## 2026-08-29 — baseline Advisor performance 01:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `08e216331e30e29a9f5b85c60d2d3223b51df0ba`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Contrôle Supabase strictement en lecture seule : Advisor performance relu sur le projet `railops` (`tbmzmmamaiftbbbuelgd`). Deux avis `unindexed_foreign_keys` de niveau `INFO` sont présents sur `public.inspections` : `inspections_agent_id_fkey` et `inspections_materiel_id_fkey` ne disposent pas d’un index couvrant. Aucun changement de base de données effectué.
- Amélioration réversible et sans runtime : `docs/supabase-advisor-baseline.md` inclut désormais cette baseline performance, distingue explicitement l’avis de performance d’une panne fonctionnelle et interdit toute création automatique d’index/contrainte dans les passages sans validation.
- Commit : `9b09c4587718f8f88706042e412a1827043b07ed` (`docs: capture Supabase performance advisor baseline`).
- Vérification : `v150B-2B checks` run `33219767864` terminé en `success` sur `9b09c4587718f8f88706042e412a1827043b07ed`; un second relevé Advisor confirme les deux mêmes avis sans dérive entre les contrôles.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, index, contrainte, policy, grant, RLS stricte, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production ; `main` est resté intact.
- Point en attente : créer des index couvrants pour ces deux clés étrangères serait une migration de schéma et reste volontairement bloqué jusqu’à validation explicite de Yohan ; aucun test utilisateur requis pour la documentation actuelle.

## 2026-08-29 — indexation des clés étrangères `inspections` 01:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `9b82bcfdf4d8ad529f12cf31479eb633666ea6eb`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`; divergence `559 ahead / 2 behind`. Supabase `railops` était `ACTIVE_HEALTHY`, les deux clés étrangères existaient bien et `public.inspections` n’avait alors que son index primaire.
- Changement explicitement approuvé par Yohan : ajout de la migration idempotente `supabase/migrations/20260829_inspections_fk_indexes.sql`, commit `040b9aeec2b54794af337928dc8d659139c97b0b` (`perf: add inspections foreign-key indexes`), puis application Supabase de `inspections_fk_indexes`. Deux index btree ont été créés : `inspections_agent_id_idx(agent_id)` et `inspections_materiel_id_idx(materiel_id)`.
- Vérification base : `pg_indexes` confirme les deux index ; l’Advisor performance ne signale plus `unindexed_foreign_keys`. Les deux nouveaux index apparaissent immédiatement comme `unused_index`, état attendu juste après création et qui ne déclenche aucune suppression automatique. L’Advisor sécurité reste sur la baseline connue ; aucune policy, permission, RLS ou fonction n’a été modifiée.
- Vérification CI du commit migration : les 5 runs observés sont terminés sans échec, dont `v150B-2B checks` runs `33219983672` et `33219987072`, `RailOps lifecycle regression` `33219987224`, `RailOps modules regression` `33219987031` et `Final RLS hotfix check` `33219987034`; statut Vercel preview `success`.
- Documentation mise à jour dans `docs/supabase-advisor-baseline.md`, commit `c92b3f97a317b370217186e8bf05d5d59272dd9c` (`docs: record approved inspections index migration`).
- Garde-fous respectés : aucun code runtime, donnée métier, contrainte, policy, grant, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge et aucun changement de `main`.
- Point en attente : surveiller simplement l’usage réel des deux index lors de prochains relevés Advisor ; aucune décision ou test utilisateur requis maintenant.
