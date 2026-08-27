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

## 2026-08-27 — historique complet préservé pour le diagnostic CI 02:16 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` uniquement, head initial `830fae32bb2e0416cb51ff4440925bebc6f9cd6a`; `main` est resté intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` est `ACTIVE_HEALTHY`; le Security Advisor a été relu strictement en lecture seule, sans appliquer aucune remédiation.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` protège désormais `fetch-depth: 0`, nécessaire au calcul fiable de la dérive `main`/branche et de la merge-base. Aucun workflow, code runtime ou comportement applicatif n’a été modifié.
- Commit principal : `e349c50ed4e2a9bb6b49052363d63707097f0e11` (`test: preserve full-history drift diagnostics`).
- Vérification fraîche : `v150B-2B checks` run `33026272760` est `success` sur ce commit.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué.
- Point en attente : aucun nouveau point nécessitant une décision ou un test utilisateur ; les alertes Supabase de sécurité observées restent volontairement hors scope sans validation explicite.

## 2026-08-27 — permissions CI strictement lecture seule 03:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `1bc092cfb4b5165f533763bb88a6474c7ff03c3f`; le workflow réel `.github/workflows/v150b2b-checks.yml` déclare uniquement `permissions: contents: read`. La tentative de relecture Supabase strictement en lecture seule a été refusée par le connecteur (`You do not have permission to perform this action`), donc aucune donnée, policy ou configuration Supabase n'a été touchée.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` vérifie désormais que le bloc `permissions` du workflow contient exactement `contents: read` et aucune permission additionnelle explicite, afin d'éviter une élévation de privilèges accidentelle lors d'une future édition CI. Aucun workflow ni code runtime n'a été modifié.
- Commit principal : `6a547e37ef1f0747292138ea1ba35195cc9cdc1a` (`test: lock workflow to read-only permissions`).
- Vérification fraîche : `v150B-2B checks` run `33029678448`, job `checks` `98379047912`, est `success`; `Run v150B-2B verification suite` est passé avec succès.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n'a pas été modifié.
- Point en attente : aucun choix produit ou test utilisateur requis. La lecture Supabase devra simplement être retentée lors d'un prochain passage si l'accès du connecteur redevient disponible.

## 2026-08-27 — garde-fou CI sans secrets 04:14 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `d3825513295dd9bfb2705725ad5c04aa0d54990a`; `main` est resté intact à `37b216936a6692d54f82cbc004b30c936d13785a` et la branche est actuellement en divergence contrôlée (`ahead=448`, `behind=2`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`). Supabase `railops` est `ACTIVE_HEALTHY`; le Security Advisor a été relu strictement en lecture seule, sans appliquer aucune remédiation.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` vérifie désormais que le workflow de branche ne consomme aucune référence `secrets.*`, afin de conserver une CI purement diagnostique et sans accès implicite à des secrets de dépôt ou d’environnement. Aucun workflow ni code runtime n’a été modifié.
- Commit principal : `6828356b60bc4da08ca2fd1e37cba922a76a6bb8` (`test: keep branch CI free of secrets`).
- Vérification fraîche : `v150B-2B checks` run `33032648810`, job `checks` `98388439641`, est `success`; la suite `Run v150B-2B verification suite` est passée avec succès.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les avertissements du Security Advisor restent documentés et volontairement hors scope sans validation explicite.

## 2026-08-27 — garde-fou CI sans installation de dépendances 05:17 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `4872ca1d9da44620b32cc1f7ec1a1071bbbd559a`; `main` est resté intact à `37b216936a6692d54f82cbc004b30c936d13785a`, avec divergence contrôlée (`ahead=450`, `behind=2`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`). Supabase `railops` a été relu strictement en lecture seule : projet `ACTIVE_HEALTHY`, RLS activé mais non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` protège désormais l’exécution directe de la suite avec Node 22 et interdit l’ajout futur d’étapes `npm`/`npx`/`pnpm`/`yarn`/`bun` d’installation ou d’exécution de paquets dans ce workflow diagnostique. Aucun workflow ni code runtime n’a été modifié.
- Commits : `a0655ac5ba9e8d0b91aa4ade73fb8027c3c2cee0` a révélé un matcher trop strict ; correction purement test dans `934c96f616e9c53838f55978016cf9d0401a41ee` (`test: fix Node runtime guard matcher`).
- Vérification fraîche : `v150B-2B checks` run `33036061425` est `success` sur `934c96f616e9c53838f55978016cf9d0401a41ee`; les 30 tests et 8 cibles de syntaxe sont couverts par le runner agrégé.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; la dérive de `main` reste informative et toute intégration demeure hors scope sans validation explicite.

## 2026-08-27 — garde-fou environnement CI et compatibilité de couverture 06:17 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` uniquement ; head final avant journal `5498ada86430d53da5ae1cfccf37b20d04ad1003`. Supabase `railops` a été relu strictement en lecture seule et reste `ACTIVE_HEALTHY`; les alertes du Security Advisor ont été observées sans aucune remédiation.
- Améliorations réversibles : `tests/v150b2b-ci-branch-safety.test.js` interdit désormais qu’une CI diagnostique soit rattachée à un `environment` GitHub de déploiement/protection. Le wrapper `tests/v150b2b-offline-sync-error-regression.test.js` accepte désormais l’ajout de nouveaux cas canoniques tout en exigeant au minimum les 6 scénarios de retry/file déjà couverts.
- Commits : `8d0c5135f0d2a1f20e421b3d37c7694ff7ce4361` (`test: keep diagnostic CI outside deployment environments`) et `5498ada86430d53da5ae1cfccf37b20d04ad1003` (`test: tolerate additive offline sync regression coverage`).
- Vérification fraîche : le premier run PR `33038832413` a correctement révélé une incompatibilité de test avec `main`, qui expose maintenant 7 cas offline au lieu de 6 ; après correction du wrapper uniquement, `v150B-2B checks` run push `33038900973` est `success` sur `5498ada86430d53da5ae1cfccf37b20d04ad1003`.
- Garde-fous respectés : aucun code runtime, workflow métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié par cette passe.
- Point en attente : aucun choix produit ni test utilisateur requis ; les sujets de sécurité Supabase nécessitant une décision restent volontairement hors scope.
