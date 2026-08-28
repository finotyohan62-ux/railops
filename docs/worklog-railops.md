# RailOps — journal de travail

> Historique intégral du journal jusqu’au passage du 2026-08-28 22:15 Europe/Paris : `docs/worklog-railops-archive-through-2026-08-28-2215.md`. Le journal courant continue ci-dessous.

## 2026-08-28 — diagnostics explicites du manifeste CI critique 23:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `4846a5cdfdf1c5cede76f051308722ad4f9c48e6`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence `2 commits behind / 550 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`; RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`. Aucune écriture Supabase effectuée.
- Amélioration réversible et sans runtime : `tests/v150b2b-runner-coverage.test.js` exige désormais des diagnostics directs si le manifeste de gardes CI critiques est vide ou contient des doublons ; `tests/run-v150b2b-checks.js` arrête immédiatement la vérification avec un message explicite dans ces deux cas.
- Cycle rouge/vert vérifié : commit test `7cfc9dc939373c5ea9d23d14cc15274f75cf4a31` a fait échouer `v150B-2B checks` run `33211667565`; commit fonctionnel `debaa6fd622080219ac81f691e0896e78839cd0b` (`ci: diagnose invalid critical test manifest`) a remis l’étape `Run v150B-2B verification suite` au vert dans le run `33211720507`.
- Garde-fous respectés : aucun code applicatif runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; les deux commits `main` absents de la branche touchent `js/core/sync.js` et ses tests, donc leur intégration reste volontairement hors scope sans validation explicite.
