# RailOps — journal de travail

> Historique intégral du journal jusqu’au passage du 2026-08-28 04:17 Europe/Paris : `docs/worklog-railops-archive-through-2026-08-28-0417.md`. Cette archive pointe vers le blob Git exact du journal précédent ; le journal courant continue ci-dessous.

## 2026-08-28 — snapshot GitHub/Supabase frais 05:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head initial `6d302fb82c3905d7143526d60c9d5a0cd793cc26`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence initiale `2 commits behind / 509 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`, `chantiers=22`, `materiels=1689`, `scans=124`, `users=34`; RLS activé mais non forcé sur les tables cœur contrôlées. Security Advisor et Performance Advisor relus sans aucune remédiation.
- Amélioration réversible : ajout du snapshot `docs/supabase-state/2026-08-28-0512.md`. Les commits `70fbd5b71b7e10bd7df946df3cab3541d3416d00` et `91548f37960663c23531378504a7b136635a79c3` ont révélé deux exigences textuelles du contrat snapshot ; le correctif documentaire final `562e6988633ef7ff91379b06fd6992a592931429` les aligne sans toucher au runtime.
- Vérification fraîche : `v150B-2B checks` run `33138432764` est `success` sur `562e6988633ef7ff91379b06fd6992a592931429`.
- Maintenance du journal : l’ancien contenu de `docs/worklog-railops.md` est préservé bit pour bit dans `docs/worklog-railops-archive-through-2026-08-28-0417.md` avant poursuite du journal courant.
- Garde-fous respectés : aucun code runtime, workflow métier, règle métier, permission applicative, donnée, migration, schéma, RLS stricte, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production effectué ; `main` n’a pas été modifié.
- Point en attente : aucun choix produit ni test utilisateur requis ; les remédiations sécurité/performance et toute intégration de la dérive de `main` restent volontairement hors scope sans validation explicite.

## 2026-08-28 — durcissement des tests diagnostics 06:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée à `14ebe67959dd7b7d975a499dc4684ff3e4093ad9`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` relu en lecture seule, statut `ACTIVE_HEALTHY`; RLS des tables cœur contrôlées toujours activé et non forcé.
- Amélioration réversible et sans runtime : `tests/v150b2b-diagnostics.test.js` vérifie désormais explicitement que la génération du snapshot diagnostics ne mute pas l’état applicatif et que seuls les marqueurs `_pending === true` sont comptés comme scans en attente.
- Commit : `7c2bd8ea7fcf9c80683770389e250d7014b26c9c` (`test: harden diagnostics purity checks`).
- Vérification fraîche : `v150B-2B checks` run `33141427795` est `success` sur ce commit ; le garde ciblé diagnostics passe avec la suite v150B-2B.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; la dérive de `main` et toute remédiation sécurité/performance restent hors scope sans validation explicite.

## 2026-08-28 — robustesse diagnostics sur états malformés 07:16 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `cb114b498d2f08d0a55e6acfc46358eefaffd811`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` confirmé `ACTIVE_HEALTHY`; contrôle SQL lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout d’un cas de régression dans `tests/v150b2b-diagnostics.test.js` pour vérifier que des collections malformées ou seulement « array-like » sont ignorées proprement, ne gonflent aucun compteur, ne créent aucun faux scan en attente et n’émettent aucun faux avertissement ; la version numérique est toujours sérialisée en texte et un indicateur `online` non booléen reste `null`.
- Commit fonctionnel : `5a48d9552481f44ee5f8cad1f3d101c41ebcf30a` (`test: cover malformed diagnostics state`).
- Vérification fraîche : `v150B-2B checks` run `33144243263` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, permission, règle métier, Import, logique Multi-chantier, purge hebdomadaire ni RLS stricte modifiés ; aucun merge ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; toute intégration de la dérive de `main`, remédiation sécurité/performance ou changement de permissions reste volontairement hors scope sans validation explicite.

## 2026-08-28 — diagnostic réseau indéterminé 08:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `fe9b3329e07172554e78d6cfc22a182af2f15faf`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence `2 commits behind / 518 ahead` avant ce passage. Contrôle Supabase strictement en lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout d’un cas de régression dans `tests/v150b2b-diagnostics.test.js` pour garantir qu’un état Chef de chantier avec connectivité inconnue (`online=null`) n’émet pas à tort `CHEF_CHANTIER_STATS_MISSING`.
- Commit fonctionnel : `0752b355656dbdf02ddf94778c8c9cd3d9129bed` (`test: cover unknown connectivity diagnostics`).
- Vérification fraîche : `v150B-2B checks` run `33147476680` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, permission, règle métier, Import, logique Multi-chantier, purge hebdomadaire ni RLS stricte modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; la dérive de `main`, les remédiations sécurité/performance et tout changement de permissions restent volontairement hors scope sans validation explicite.

## 2026-08-28 — maintien des alertes diagnostics hors ligne 09:14 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `b26caa299eca6d3ec2d5b6557323683be38ee142`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` confirmé `ACTIVE_HEALTHY`; contrôle SQL strictement en lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout de `tests/v150b2b-diagnostics-offline-warning.test.js`, auto-découvert par le runner v150B-2B, pour garantir que le mode hors ligne ne masque que l’alerte dépendante de la disponibilité serveur (`CHEF_CHANTIER_STATS_MISSING`) et conserve les alertes de fuite de scope et d’invariants de session.
- Commit fonctionnel : `85dd3c26995a243492eb41f72264a2b11e30e5a2` (`test: preserve offline diagnostic warnings`).
- Vérification fraîche : `v150B-2B checks` run `33150724207` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; toute intégration de la dérive de `main`, remédiation sécurité/performance ou changement de permissions reste volontairement hors scope sans validation explicite.

## 2026-08-28 — index de couverture diagnostics 10:17 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `3f3bd85874c225080c212de2d64e5c49928e037b`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` confirmé `ACTIVE_HEALTHY`; contrôle lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et documentaire uniquement : `docs/v150b2b-test-inventory.md` référence désormais explicitement les six gardes diagnostics auto-découverts (forme/pureté, confidentialité, warnings, comportement hors ligne, wiring preview et guide logs) et rappelle que le runner reste la source d’autorité d’exécution.
- Commit fonctionnel : `17e14155588f9026cedfb17161843a848d677c41` (`docs: index diagnostics test coverage`).
- Vérification fraîche : `v150B-2B checks` run `33154738797` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent hors scope sans validation explicite.

## 2026-08-28 — stabilité de l’ordre des alertes diagnostics 11:14 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `2707fbae55f85bdb277a8a538161b456c0c0a9d7`, puis `dda00a06994f56ea45076b2ec095970581a0913f` après le garde ajouté ; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` confirmé `ACTIVE_HEALTHY`; contrôle SQL strictement en lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout de `tests/v150b2b-diagnostics-warning-order.test.js`, auto-découvert par le runner, pour verrouiller un ordre déterministe des alertes lorsque plusieurs invariants diagnostics échouent simultanément et garantir l’absence de doublons. Cela stabilise les logs/support sans modifier la logique applicative.
- Commit fonctionnel : `dda00a06994f56ea45076b2ec095970581a0913f` (`test: lock diagnostics warning order`).
- Vérification fraîche : `v150B-2B checks` run `33158516812` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent hors scope sans validation explicite.

## 2026-08-28 — garde anti-faux-positifs diagnostics 12:18 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `e726a3e547acc7ecd7da10fe0f7f7705f70e8c82`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Comparaison fraîche après le garde : `2 commits behind / 527 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`. Contrôle Supabase strictement en lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout de `tests/v150b2b-diagnostics-normal-roles.test.js` pour garantir qu’un état normal `agent`, `chef`, propriétaire en mode `admin` et session déconnectée n’émet aucun faux avertissement diagnostics.
- Commit fonctionnel : `5e4fb36a8a756a4e0e6a3826fb082c06853e3b14` (`test: guard diagnostics normal role states`).
- Vérification fraîche : `Final RLS hotfix check` run `33162794857` terminé en `success` sur le commit fonctionnel.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent volontairement hors scope sans validation explicite.

## 2026-08-28 — documentation de la connectivité diagnostics 13:21 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` au head `cb8bfa19cc3d84b8253ca583766643c61f20e917`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`. Projet Supabase `railops` confirmé `ACTIVE_HEALTHY`; contrôle SQL strictement en lecture seule : RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout du garde documentaire `tests/v150b2b-diagnostics-connectivity-guide.test.js`, puis clarification de `docs/v150b2b-diagnostics-guide.md` : `CHEF_CHANTIER_STATS_MISSING` exige désormais explicitement une connectivité confirmée (`online === true`) dans la documentation, et le cas connectivité inconnue (`online = null`) est documenté comme non-déclencheur afin d’éviter les faux positifs.
- Cycle vérifié : commit test rouge `cc137b21596cc33bf2159b0f168632f8dc2bab6c` (`test: guard diagnostics connectivity guide`) a bien fait échouer le check `v150B-2B`; correction documentaire `d7a5dc98e050d6a4773bb4531c02c79d66caf2e7` (`docs: clarify diagnostics connectivity semantics`) a remis la suite au vert.
- Vérification fraîche : `v150B-2B checks` run `33166805998` terminé en `success` sur `d7a5dc98e050d6a4773bb4531c02c79d66caf2e7`.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent volontairement hors scope sans validation explicite.

## 2026-08-28 — référence des alertes diagnostics 14:14 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `9f23b6f625531176664c1e0758e0d50ad7cd9654`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence initiale `2 commits behind / 531 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`; RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : ajout de `docs/v150b2b-diagnostics-warning-reference.md`, qui décrit les neuf codes d’alerte diagnostics, leur interprétation et les précautions de support sans définir de règle métier ; ajout de `tests/v150b2b-diagnostics-warning-reference.test.js` pour garantir que la documentation reste exactement synchronisée avec les codes réellement émis par `v150b2b-diagnostics.js`.
- Commits fonctionnels : `97ae49d8ce40356bd3b80475ca4aaf6d2ad21de1` (`docs: add diagnostics warning reference`) puis `f5cd4b324f2ff4ee42de6401849395a956f21e90` (`test: keep diagnostics warning reference in sync`).
- Vérification fraîche : `v150B-2B checks` run `33170223210` terminé en `success` sur `f5cd4b324f2ff4ee42de6401849395a956f21e90`; le garde ciblé `focused` est également `success`.
- Garde-fous respectés : aucun code runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent volontairement hors scope sans validation explicite.

## 2026-08-28 — inventaire diagnostics synchronisé 15:17 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `8b9a6201d1218a4c40b037619ecfbfaecad5c46d`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence initiale `2 commits behind / 534 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`; RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et documentaire uniquement : `docs/v150b2b-test-inventory.md` référence désormais aussi les gardes diagnostics `normal-roles`, `warning-order`, `warning-reference` et `connectivity-guide`, déjà auto-découverts par le runner mais absents de l’index humain.
- Commit fonctionnel : `808990d2d7ec83aeba5486891549bc8fddf9e16b` (`docs: refresh diagnostics test inventory`).
- Vérification fraîche : `v150B-2B checks` run `33174717504` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent volontairement hors scope sans validation explicite.

## 2026-08-28 — garde contre les écritures concurrentes 16:20 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `b47044724510c66d669b5042b149777767c33988`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence initiale `2 commits behind / 536 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`; RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et documentaire uniquement : `docs/v150b2b-safe-change-checklist.md` exige désormais de relire le head de branche juste avant toute écriture GitHub et de refaire le diagnostic si la branche a avancé ; la vérification minimale demande aussi de contrôler que le commit ne contient que les fichiers prévus.
- Commit fonctionnel : `e6abd74bcfb22414bbbbef43edbbcb290398fe08` (`docs: add concurrent-write guard to safe checklist`).
- Vérification fraîche : `v150B-2B checks` run `33179606327` terminé en `success` sur ce commit ; le commit fonctionnel ne modifie que `docs/v150b2b-safe-change-checklist.md` (+2 lignes).
- Garde-fous respectés : aucun runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent volontairement hors scope sans validation explicite.

## 2026-08-28 — garde CI de la checklist anti-concurrence 17:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `08ae60ef2a38d128fd1c1ad599cc98aa4a67c2b9`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence initiale `2 commits behind / 538 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`; RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : `tests/v150b2b-safe-change-checklist-contract.test.js` verrouille désormais explicitement les deux garde-fous anti-écriture concurrente de la checklist : relire le head juste avant toute écriture GitHub et interrompre/re-diagnostiquer si la branche a avancé.
- Commit fonctionnel : `18a4068b4e92db0c0f8909b2a71bfb9497f944cc` (`test: guard concurrent-write checklist safety`) ; ce commit ne modifie que le test de contrat (+2 lignes).
- Vérification fraîche : `v150B-2B checks` run `33184198315` terminé en `success` sur le commit fonctionnel ; comparaison après vérification `2 commits behind / 539 ahead`.
- Garde-fous respectés : aucun runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent volontairement hors scope sans validation explicite.

## 2026-08-28 — lecture prudente de la dérive de branche 18:17 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `cf6768605de0ae7cf6e17d1ffe7905d7aa3e71bb`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`; RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et documentaire uniquement : `docs/v150b2b-test-inventory.md` explique désormais comment interpréter `behind`, `ahead`, `Main-only runtime-impact files` et `Compatibility review` sans transformer le diagnostic de dérive en action automatique.
- Commit fonctionnel : `72582b429c85759d113ec4db66a92bd407d90c8f` (`docs: clarify safe branch-drift triage`).
- Vérification fraîche : `v150B-2B checks` run `33189416257` terminé en `success` sur ce commit.
- Garde-fous respectés : aucun runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni action Supabase ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; toute intégration de la dérive de `main`, remédiation sécurité/performance ou changement de permission reste volontairement hors scope sans validation explicite.

## 2026-08-28 — contrat de fraîcheur de dérive 19:15 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `cf48d8e3d3797c32f1336dfa60fa99ddfbd66e11`; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`, divergence `2 commits behind / 542 ahead`, merge-base `20f7e028ac5e3d0ac401d41ec3561af09e252694`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`; RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et sans runtime : `tests/v150b2b-branch-drift-doc-contract.test.js` verrouille désormais la fraîcheur du diagnostic GitHub, l’interdiction de réutiliser un ancien `ahead/behind` et l’interdiction de conclure à la compatibilité sur la seule base d’une CI verte.
- Commit fonctionnel : `e01c5e30b3d008d96c616ba8f52e25ff04142946` (`test: harden branch-drift documentation contract`).
- Vérification fraîche : `v150B-2B checks` push run `33193837584` terminé en `success`; `Final RLS hotfix check`, `RailOps lifecycle regression` et `RailOps modules regression` sont également `success` sur ce commit.
- Garde-fous respectés : aucun runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick ni déploiement production ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent volontairement hors scope sans validation explicite.

## 2026-08-28 — index du garde de dérive 20:14 Europe/Paris

- État réel contrôlé avant changement : branche `security/v150b2b-rls-ready` observée au head `4ac04f0331f78d0d8b9c0e698dac71bec41f1377`, puis `9c78e0807946e57fbedd8ad74c4c59ccbe9c47a5` après l’amélioration ; `main` observé et laissé intact à `37b216936a6692d54f82cbc004b30c936d13785a`.
- Contrôle Supabase strictement en lecture seule : projet `railops` `ACTIVE_HEALTHY`; RLS activé et non forcé sur `chantiers`, `materiels`, `scans` et `users`.
- Amélioration réversible et documentaire uniquement : `docs/v150b2b-test-inventory.md` référence désormais explicitement `v150b2b-branch-drift-doc-contract.test.js` dans un bloc dédié aux gardes documentaires auto-découvertes, afin que l’index humain reflète le contrat de sécurité déjà appliqué par la CI.
- Commit fonctionnel : `9c78e0807946e57fbedd8ad74c4c59ccbe9c47a5` (`docs: index branch-drift safety guard`).
- Vérification fraîche : `v150B-2B checks` run `33198339400` terminé en `success`; le fichier modifié sur le commit fonctionnel est uniquement `docs/v150b2b-test-inventory.md`.
- Garde-fous respectés : aucun runtime, donnée, schéma, migration, RLS stricte, permission, règle métier, Import, logique Multi-chantier ou purge hebdomadaire modifiés ; aucun merge, rebase, cherry-pick, déploiement production ni écriture Supabase ; `main` est resté intact.
- Point en attente : aucun choix produit ni test utilisateur requis ; intégration de la dérive de `main`, remédiation sécurité/performance et tout changement de permission restent volontairement hors scope sans validation explicite.
