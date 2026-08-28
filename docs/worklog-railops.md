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
