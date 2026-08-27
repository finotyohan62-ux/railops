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

## 2026-08-27 — contrat CI limité aux actions GitHub officielles 07:17 Europe/Paris

- État réel contrôlé : branche `security/v150b2b-rls-ready` au head initial `63ebebb0f0bb42a8f26086d182dc29020f8f4e81`; workflow `.github/workflows/v150b2b-checks.yml` relu avant changement. Supabase `railops` a ensuite été contrôlé strictement en lecture seule : projet `ACTIVE_HEALTHY`; Security Advisor relu sans aucune remédiation ni mutation.
- Amélioration réversible : ajout de `tests/v150b2b-ci-actions-contract.test.js`, qui verrouille la surface d’actions du workflow diagnostique aux deux actions GitHub officielles actuellement prévues (`actions/checkout@v4` et `actions/setup-node@v4`) et détecte aussi les doublons inutiles. Aucun workflow ni code runtime n’a été modifié.
- Commit principal : `d487f678110bf53eb6aa49be7c76f1f22fc3ae9e` (`test: constrain CI to official GitHub actions`).
- Vérification fraîche : `v150B-2B checks` run push `33042030168` est `success` sur ce commit.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les avertissements du Security Advisor restent volontairement hors scope sans validation explicite.

## 2026-08-27 — garde-fou CI contre les mutations Git locales 08:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `a7288617dd8055c3370782357cd074e76725b647`; `main` est resté intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` a été relu strictement en lecture seule : projet `ACTIVE_HEALTHY`, avec `chantiers=22`, `materiels=1689`, `scans=121`, `users=34`.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` interdit désormais aussi les commandes Git locales susceptibles de modifier l’historique, les refs ou le worktree (`commit`, `checkout`, `switch`, `branch`, `tag`, `update-ref`, `clean`) dans le workflow diagnostique. Aucun workflow ni code runtime n’a été modifié.
- Commit principal : `b6799c1bd482f0ee25ccafdd230c688621a5c873` (`test: guard drift diagnostics from local git mutations`).
- Vérification fraîche : `v150B-2B checks` run `33045378671`, job `checks` `98428035516`, est `success`; les régressions lifecycle et le contrôle ciblé RLS ont également terminé en `success` sur le même head.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les changements sécurité/data restent volontairement hors scope sans validation explicite.

## 2026-08-27 — mode Bash strict pour le diagnostic de dérive 09:12 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `1c658783deb03f871c625944b752389b6b934c69`; `main` est resté intact à `37b216936a6692d54f82cbc004b30c936d13785a`, avec divergence contrôlée (`ahead=460`, `behind=2`). Supabase `railops` a été relu strictement en lecture seule : projet `ACTIVE_HEALTHY`, avec `chantiers=22`, `materiels=1689`, `scans=121`, `users=34`.
- Amélioration réversible : le bloc `Report branch drift (non-blocking)` utilise désormais `set -euo pipefail`, afin qu’une erreur de commande ou de pipeline ne soit plus silencieusement masquée ; le garde-fou associé est couvert dans `tests/v150b2b-ci-branch-safety.test.js`. Aucun code runtime, règle métier ou comportement applicatif n’a été modifié.
- Cycle TDD vérifié : commit test-only `0507ec3e12faba2a90ba027cddd9f66c8bc0266f` a fait échouer `v150B-2B checks` (runs push `33048925206` et PR `33048927855`) comme attendu ; commit correctif `bf3593f32ea92b84b98cf7caf175e3ec2ce99b97` (`ci: enable strict bash for drift diagnostics`) a ensuite passé le run push `33048989871` en `success`.
- Garde-fous respectés : aucune donnée, migration, schéma, permission applicative, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les sujets sécurité/data restent volontairement hors scope sans validation explicite.

## 2026-08-27 — snapshot GitHub/Supabase frais 10:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `7f4ad058a31b944b8630aa9ab630a877440554ed`; `main` observé à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence `2 commits behind / 463 ahead`. Supabase `railops` est `ACTIVE_HEALTHY`; volumétrie cœur stable (`chantiers=22`, `materiels=1689`, `scans=121`, `users=34`), RLS activé mais non forcé sur les tables cœur suivies, Advisors relus strictement en lecture seule.
- Amélioration réversible : ajout de `docs/supabase-state/2026-08-27-1018.md` pour consigner l’état GitHub/Supabase frais, les comptages de policies, les alertes Security Advisor inchangées et les deux FK `inspections` non indexées ; aucune remédiation automatique ni mutation Supabase.
- Commits : `622b103d3c0dbec038930257afbb2549b1f23dd7` a créé le snapshot ; `2338fab0bee260e93b5887c0c53039cbfe10c3ba` a corrigé un premier marqueur documentaire ; `80df046d3b60fce267c41463a55ddcd34f2f3fa0` a aligné le snapshot sur l’ensemble du contrat diagnostique existant.
- Vérification fraîche : `v150B-2B checks` run `33053845755` est `success` sur `80df046d3b60fce267c41463a55ddcd34f2f3fa0`. Les deux échecs précédents étaient limités au contrat textuel du nouveau snapshot et ont servi à diagnostiquer puis corriger le document, sans toucher au runtime.
- Garde-fous respectés : aucun code runtime, règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit ni test utilisateur requis ; les avertissements sécurité/performance Supabase restent volontairement hors scope sans validation explicite.

## 2026-08-27 — portée du fetch de dérive verrouillée 11:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `fd7dead7c4b9d517d2376fd7d4fa1e1b5a5e0977`; workflow `.github/workflows/v150b2b-checks.yml` relu avant changement. `main` est resté intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` exige désormais que le diagnostic de dérive récupère uniquement `main` via `git fetch --no-tags origin main:refs/remotes/origin/main` et rejette les fetchs élargis (`--all`, `--mirror` ou refspec global). Aucun workflow ni code runtime n’a été modifié.
- Commit principal : `1a76dc2a54b16a3cf1ea2dd5839a87664585ee74` (`test: constrain branch drift fetch scope`).
- Vérification fraîche : `v150B-2B checks` run `33057844742`, job `checks` `98468985384`, est `success`; le diagnostic de dérive et `Run v150B-2B verification suite` sont tous deux passés.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les changements sécurité/data restent volontairement hors scope sans validation explicite.

## 2026-08-27 — checkout CI lié au commit de l’événement 12:20 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` uniquement ; `main` est resté intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence contrôlée `ahead=469`, `behind=2` avant le commit de test. Supabase `railops` a été relu strictement en lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` vérifie désormais explicitement que l’étape `Checkout` reste sur `actions/checkout@v4` et n’ajoute pas de `ref:` personnalisé, afin que la suite CI teste toujours exactement le commit poussé ou revu au lieu d’un autre ref. Aucun workflow ni code runtime n’a été modifié.
- Commit principal : `769fd19d76b321aecbc53e7b9ef88fa12a218927` (`test: keep CI checkout on event commit`).
- Vérification fraîche : `v150B-2B checks` run `33062528335` est `success` sur ce commit.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les sujets sécurité/data et toute intégration de la dérive de `main` restent volontairement hors scope sans validation explicite.

## 2026-08-27 — checklist documentaire de changement sûr 13:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `35d59a62fcbd9ac226ee09d4f5ccf45725faf22b`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` est `ACTIVE_HEALTHY`; contrôle SQL strictement en lecture seule confirmant RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible : ajout de `docs/v150b2b-safe-change-checklist.md`, qui formalise les vérifications préalables, le périmètre des changements sûrs, les interdictions de mutation/production et la journalisation attendue pour cette branche. Aucun workflow, code runtime, règle métier ou comportement applicatif n’a été modifié.
- Commit principal : `aebe1b465ea82041dec3e42bdca4042a3c091407` (`docs: add safe branch change checklist`).
- Vérification fraîche : `v150B-2B checks` run `33066512978` est `success` sur ce commit.
- Garde-fous respectés : aucune permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les sujets sécurité/data restent volontairement hors scope sans validation explicite.

## 2026-08-27 — isolation du runner CI diagnostique 14:19 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `a67ba0bf0c873079d4b764aa23e08428893b6843`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` relu strictement en lecture seule : projet `ACTIVE_HEALTHY`, `chantiers=22`, `materiels=1689`, `scans=121`, `users=34`, RLS toujours activé sur les tables listées.
- Amélioration réversible : ajout de `tests/v150b2b-ci-isolation-contract.test.js`, auto-découvert par le runner existant, qui exige le runner GitHub hébergé `ubuntu-latest` et interdit l’introduction de job containers, service containers ou actions `docker://` dans la CI diagnostique. Aucun workflow ni code runtime n’a été modifié.
- Commit principal : `275a2589076c822766086f09407990b6d35a94dc` (`test: preserve isolated diagnostic CI runner`).
- Vérification fraîche : `v150B-2B checks` run `33071313991` est `success` sur ce commit.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les changements sécurité/data restent volontairement hors scope sans validation explicite.

## 2026-08-27 — garde-fous CI critiques protégés 15:19 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `e8f6b1fa1eada78dc18796aeffad9a40a2244135`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence contrôlée `ahead=475`, `behind=2`. Supabase `railops` a été relu strictement en lecture seule : RLS reste activé mais non forcé sur les huit tables cœur suivies, avec les mêmes comptages de policies que le snapshot du matin.
- Amélioration réversible : le runner agrégé `tests/run-v150b2b-checks.js` considère désormais `v150b2b-ci-isolation-contract.test.js` et `v150b2b-ci-nonmutation.test.js` comme gardes critiques, en plus des gardes existants. Une suppression ou un renommage accidentel de ces tests de sûreté fera désormais échouer immédiatement la suite au lieu de réduire silencieusement la couverture.
- Commit principal : `6191af75ffe7f1739cc51624223c45cdb0724432` (`test: protect CI safety guards from silent removal`).
- Vérification fraîche : `v150B-2B checks` run `33076211136` est `success` sur ce commit.
- Garde-fous respectés : aucun code runtime, workflow, règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les sujets sécurité/data et toute intégration de la dérive de `main` restent volontairement hors scope sans validation explicite.

## 2026-08-27 — garde-fous CI contre mutations indirectes 16:16 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `6e00fb4a4ba5b7c0f84e3bf8d5fed327e615a0c4`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` relu strictement en lecture seule : projet `ACTIVE_HEALTHY`; Security Advisor observé sans aucune remédiation ni mutation.
- Amélioration réversible : `tests/v150b2b-ci-branch-safety.test.js` interdit désormais aussi les surfaces de mutation indirectes via GitHub CLI (`gh pr`, `gh issue`, `gh api` avec méthode d’écriture) et `curl` avec méthodes `POST`/`PUT`/`PATCH`/`DELETE`. Aucun workflow, code runtime, règle métier ou comportement applicatif n’a été modifié.
- Commit principal : `aa1050a373ab61bd193262e3e3d7bf97ea209667` (`test: guard indirect CI mutation commands`).
- Vérification fraîche : `v150B-2B checks` run `33081230796` est `success` sur ce commit. Avant journalisation, la branche était bien sur ce head, `main` toujours à `37b216936a6692d54f82cbc004b30c936d13785a` et Supabase toujours `ACTIVE_HEALTHY`.
- Garde-fous respectés : aucune permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué.
- Point en attente : aucun choix produit ni test utilisateur requis ; les alertes sécurité Supabase restent volontairement hors scope sans validation explicite.

## 2026-08-27 — provenance des actions CI verrouillée 17:14 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `406c5d993e8f3c0747580ecd2fa277cf4f25d834`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence contrôlée `ahead=479`, `behind=2`. Supabase `railops` est `ACTIVE_HEALTHY`; contrôle SQL strictement en lecture seule confirmant RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users` (policies 4/4/4/2).
- Amélioration réversible : ajout de `tests/v150b2b-ci-action-provenance.test.js`, auto-découvert par le runner, qui limite les dépendances `uses:` du workflow diagnostique aux actions GitHub déjà revues `actions/checkout@v4` et `actions/setup-node@v4` et bloque l’introduction silencieuse d’actions tierces. Aucun workflow ni code runtime n’a été modifié.
- Commit principal : `3f5d36470da23fe3518b24ecbf805411dd1880c4` (`test: guard diagnostic action provenance`).
- Vérification fraîche : `v150B-2B checks` run `33086719917` est `success` sur ce commit.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les sujets sécurité/data et toute intégration de la dérive de `main` restent volontairement hors scope sans validation explicite.

## 2026-08-27 — contrat documentaire de sécurité CI 18:14 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `39a598daf311caf199ef98b4bffa176ffc23d219`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Supabase `railops` est `ACTIVE_HEALTHY`; contrôle SQL strictement en lecture seule confirmant RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users` avec respectivement 4/4/4/2 policies.
- Amélioration réversible : ajout de `docs/v150b2b-ci-safety-contract.md`, qui documente le périmètre événementiel, les permissions lecture seule, l'absence de secrets/déploiement, le diagnostic de dérive et la commande de vérification existante. Aucun workflow ni code runtime n'a été modifié.
- Commit principal : `0ecf415713a965aeda90d794e6a0cfb858ac781f` (`docs: document v150B-2B CI safety contract`).
- Vérification fraîche : `v150B-2B checks` run push `33092407193` et run PR `33092410507` sont `success`; les workflows `RailOps lifecycle regression`, `RailOps modules regression` et `Final RLS hotfix check` sont également `success` sur le même head. Le commit de journalisation `1f9ba79ea831b0322e64fd2b80dd98d080fe796f` a ensuite passé `v150B-2B checks` run `33092632911` en `success`.
- Garde-fous respectés : aucune règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n'a pas été modifié.
- Point en attente : aucun choix produit, test utilisateur ou changement risqué requis ; les sujets sécurité/data et toute intégration de la dérive de `main` restent volontairement hors scope sans validation explicite.
