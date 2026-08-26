# RailOps — journal de travail

> Historique intégral du journal jusqu’au passage du 2026-08-26 11:12 Europe/Paris : `docs/worklog-railops-archive-through-2026-08-26-1112.md`. Cette archive est une copie Git exacte du journal précédent ; le journal courant continue ci-dessous.

## 2026-08-26 — garde-fou CI non-mutation et contrat snapshot 20:22 Europe/Paris

- État contrôlé avant changement : branche `security/v150b2b-rls-ready` uniquement ; `main` reste à `e89c57c995fe0661cffcdbfcf88b9f30a408a093`. Supabase `railops` et ses Advisors ont été relus strictement en lecture seule.
- Améliorations réversibles : le garde-fou CI interdit désormais explicitement les commandes de déploiement production et de mutation Supabase ; le snapshot GitHub/Supabase du 26/08 a été complété avec le Performance Advisor réel (deux FK non indexées sur `public.inspections`) sans appliquer d'index ni de changement de schéma.
- Robustesse documentaire : le contrat snapshot accepte désormais le singulier `1 commit` et la ponctuation normale des listes, sans relâcher les marqueurs de sécurité. Commits principaux : `62c92589bc772590e46f6baa851c35e8eaf90f76`, `ff5c315bc68e1358e1f1762220566a3c19b8f920`, `580025c6250c4333b64f2147ebae56c13dd9a291`, `716425c0cf638b01ed0db687a43e169ae781604f`, `fa96232cb5a8defc9cc3fe046e52958805b9a85b`.
- Vérification fraîche : `v150B-2B checks` run `32999265839` est `success` sur `fa96232cb5a8defc9cc3fe046e52958805b9a85b`; `RailOps modules regression` est également `success` sur ce head.
- Garde-fous respectés : aucun code runtime, règle métier, permission, donnée, migration, RLS, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué.
- Point en attente : aucun nouveau point nécessitant une décision de Yohan ; les validations humaines et changements sécurité/performance historiques restent volontairement hors scope.

## 2026-08-26 — snapshot d’état frais et contrôle lecture seule 21:12 Europe/Paris

- État réel relu avant changement : branche `security/v150b2b-rls-ready` uniquement, `main` inchangé à `e89c57c995fe0661cffcdbfcf88b9f30a408a093`, Supabase `railops` `ACTIVE_HEALTHY` contrôlé en lecture seule.
- Amélioration réversible : ajout du snapshot `docs/supabase-state/2026-08-26-2112.md` avec divergence GitHub, volumétrie cœur, état RLS, Security Advisor et Performance Advisor ; aucune correction automatique ni mutation Supabase.
- Vérification : `v150B-2B checks` run `33004363974` est `success` sur `5f6827862bb6df33a373015f8b4889a51543419a`. Les deux premiers passages ont uniquement révélé puis fait corriger un marqueur documentaire sensible à la casse (`b8212d7a779cd73862e9a0fa3f6a432d84722c05`, `7e7c4b7b81489ba1af377db44ee2855bd33d9574`).
- Garde-fous respectés : aucun code runtime, règle métier, permission, donnée, migration, schéma, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick, RLS stricte ni déploiement production effectué.
- Point en attente : aucun nouveau point nécessitant une décision de Yohan ; les remédiations sécurité/performance observées restent volontairement hors scope.

## 2026-08-26 — garde-fou diagnostic de dérive non bloquant 22:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au commit `2f21f531110eaceb94881d002744b6713f78163f`, `main` laissé intact ; Supabase relu en lecture seule avec `chantiers=22`, `materiels=1689`, `scans=121`, `users=34`.
- Amélioration réversible : le test `tests/v150b2b-ci-branch-safety.test.js` protège maintenant explicitement le diagnostic `Report branch drift (non-blocking)` afin qu’il reste limité aux événements `push` et `continue-on-error: true`. Aucun fichier runtime ni workflow n’a été modifié.
- Commit principal : `2c514d80e5fcf05134295663d5e43af92e32e070` (`test: keep branch drift diagnostic non-blocking`).
- Vérification fraîche : `v150B-2B checks` run `33009471557` (push) et run `33009474558` (pull_request) sont `success` sur ce commit ; `RailOps lifecycle regression`, `RailOps modules regression` et `Final RLS hotfix check` sont également `success` sur le même head.
- Contrôle Supabase après vérification, toujours en lecture seule : RLS reste activé et non forcé sur `chantiers`, `materiels`, `scans` et `users` ; aucune policy ni donnée modifiée.
- Garde-fous respectés : aucun code runtime, règle métier, permission, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué.
- Point en attente : aucun nouveau point nécessitant une décision ou un test utilisateur ; les sujets sécurité/performance nécessitant validation restent volontairement hors scope.

## 2026-08-26 — garde-fous timeout et concurrence CI 23:17 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` uniquement ; `main` était à `e89c57c995fe0661cffcdbfcf88b9f30a408a093` au diagnostic initial. Pendant la vérification, `main` a avancé indépendamment à `37b216936a6692d54f82cbc004b30c936d13785a` (`Fix ghost scan integrity`) ; aucun changement de `main` n’a été effectué depuis cette branche. Supabase `railops` a été relu en lecture seule : RLS activé mais non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` protège désormais aussi `timeout-minutes: 5` et `concurrency.cancel-in-progress: true`, afin d’éviter qu’une future modification du workflow ne supprime accidentellement la limite anti-runaway ou l’annulation des exécutions CI devenues obsolètes. Aucun workflow ni code runtime n’a été modifié.
- Commit principal : `cef1f8b02b3a6422142f9e33f00184ef3a13fa1a` (`test: preserve CI timeout and concurrency guards`).
- Vérification fraîche : `v150B-2B checks` run `33014795052`, job `checks` `98330099405`, est `success`; le commit de journal `bbba7142e45d714fbe6ed3ffd813e5ca23aa4896` a aussi passé `v150B-2B checks` run `33014866846`, job `98330346723`, en `success`.
- Garde-fous respectés : aucune règle métier, permission, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué.
- Point en attente : aucun nouveau point nécessitant une décision ou un test utilisateur ; la nouvelle dérive de `main` doit simplement être relue avant toute future intégration, qui reste hors scope de cette passe.

## 2026-08-27 — garde-fous des déclencheurs CI 00:16 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` uniquement ; `main` est resté intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` est `ACTIVE_HEALTHY`; le Security Advisor a été relu en lecture seule et aucune remédiation sécurité n'a été appliquée.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` protège désormais explicitement le workflow de branche contre l'ajout futur de déclencheurs `pull_request_target`, `workflow_run` ou `schedule`, afin de préserver son périmètre événementiel et ses faibles privilèges. Aucun workflow ni code runtime n'a été modifié.
- Commit principal : `871358935b1fdc1ed5d7999b5a5da4eb959e70af` (`test: guard CI trigger privilege boundaries`).
- Vérification fraîche : `v150B-2B checks` run `33018983532`, job `checks` `98344319220`, est `success`; la suite `Run v150B-2B verification suite` est passée avec succès.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué.
- Point en attente : aucun nouveau point nécessitant une décision ou un test utilisateur ; les alertes Supabase de sécurité observées restent volontairement hors scope tant qu'une validation explicite n'est pas donnée.

## 2026-08-27 — périmètre événementiel CI resserré 01:17 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` uniquement, head initial `bc4f4232895f40d9b07ea6100c3f06ca1994bad6`; `main` est resté intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` est `ACTIVE_HEALTHY`; le Security Advisor a été relu strictement en lecture seule, sans remédiation ni mutation.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` protège désormais aussi contre l'ajout futur de déclencheurs `workflow_dispatch` et `repository_dispatch`, afin que la CI de cette branche reste limitée au flux de vérification prévu. Aucun workflow ni code runtime n'a été modifié.
- Commit principal : `afc277af87356d9d7ef349759138937a37e083b8` (`test: keep branch CI event scope narrow`).
- Vérification fraîche : `v150B-2B checks` run `33022784789`, job `checks` `98356927714`, a exécuté `Run v150B-2B verification suite` avec conclusion `success`.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué.
- Point en attente : aucun nouveau point nécessitant une décision ou un test utilisateur ; les alertes Supabase de sécurité déjà observées restent volontairement hors scope sans validation explicite.
